const Issue = require('../Models/IssueModel');
const Users = require('../Models/UserModel');
const Notification = require('../Models/NotificationModel');
const { createNotification } = require('./NotificationController');
const { logActivity } = require('./ActivityController');
const socketConfig = require('../Config/socket');
const multer = require('multer');
const path = require('path');

const uploadMiddleware = require('../Middleware/uploadMiddleware');
const upload = uploadMiddleware.single('image');

// Maps issue category → dept_admin department name
const CATEGORY_TO_DEPARTMENT = {
  'Garbage': 'Garbage',
  'Streetlight': 'Streetlight',
  'Pothole': 'Potholes',
  'Water Leakage': 'Water Leakage',
  'Other': 'Other'
};

/**
 * Picks the dept_admin in the given department who currently has the
 * fewest non-Resolved issues assigned to them (Round-Robin / Least-Load).
 * Returns null if no eligible admin exists.
 */
const getLeastLoadedAdmin = async (department) => {
  // Find all active (non-blocked) dept_admins for this department
  const admins = await Users.find({
    role: 'dept_admin',
    department,
    isBlocked: false
  }).select('_id name');

  if (!admins.length) return null;

  // Count open (Pending + In Progress) issues per admin in parallel
  const loads = await Promise.all(
    admins.map(async (admin) => {
      const count = await Issue.countDocuments({
        assignedTo: admin._id,
        status: { $ne: 'Resolved' }
      });
      return { admin, count };
    })
  );

  // Sort by load ascending; pick the lightest-loaded admin
  loads.sort((a, b) => a.count - b.count);
  return loads[0].admin;
};

// Controller: create issue with image + auto-assign to least-loaded dept_admin
exports.createIssue = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Image upload failed', error: err.message });
    }

    try {
      const { title, description, category, createdBy, latitude, longitude, address, area, state } = req.body;

      // Validate required fields
      if (!title || !description || !category || !createdBy || !latitude || !longitude) {
        return res.status(400).json({ success: false, message: 'All required fields must be provided' });
      }

      // Auto-assign to the least-loaded dept_admin for this category
      const department = CATEGORY_TO_DEPARTMENT[category];
      let assignedAdmin = null;
      if (department) {
        assignedAdmin = await getLeastLoadedAdmin(department);
      }

      const issue = new Issue({
        title,
        description,
        category,
        createdBy,
        location: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          address,
          area: area || 'Unknown',
          state: state || ''
        },
        image: req.file ? req.file.path : null,
        assignedTo: assignedAdmin ? assignedAdmin._id : null,
        // Always start as Pending — auto-assigning puts it in an admin's queue,
        // but the admin hasn't acknowledged or started work yet.
        // The admin explicitly moves it to "In Progress" when they begin working.
        status: 'Pending'
      });

      await issue.save();

      // Notify the assigned admin (if any)
      if (assignedAdmin) {
        await createNotification(
          assignedAdmin._id,
          createdBy,
          'ASSIGNMENT',
          issue._id,
          `A new "${category}" issue "${title}" has been assigned to you.`
        );
      }

      // Log Create Issue Activity
      logActivity(createdBy, 'CREATE_ISSUE', { issueId: issue._id, title: issue.title }, req.ip);

      // Populate for response
      await issue.populate('assignedTo', 'name email department');

      res.status(201).json({
        success: true,
        message: assignedAdmin
          ? `Issue reported and assigned to ${assignedAdmin.name}`
          : 'Issue reported successfully (no admin available for auto-assignment)',
        issue
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
  });
};



// Get all issues (Admin)
exports.getAllIssues = async (req, res) => {
  try {
    const issues = await Issue.find()
      .populate('createdBy', 'name email mobile location profilePicture')
      .populate('assignedTo', 'name email department mobile location profilePicture');
    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get issue by ID
exports.getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('createdBy', 'name email mobile location profilePicture')
      .populate('assignedTo', 'name email department mobile location profilePicture')
      .populate('comments.user', 'name role profilePicture');
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.status(200).json(issue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update issue status (Admin)
exports.updateIssueStatus = async (req, res) => {
  try {
    const { status } = req.body;

    let updateData = { status };
    if (status === 'Resolved') {
      updateData.resolvedAt = Date.now();
    }

    const issue = await Issue.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('createdBy', 'name email mobile location profilePicture')
      .populate('assignedTo', 'name email department mobile location profilePicture');
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    // Notify the user who created the issue
    if (issue.createdBy) {
      await createNotification(
        issue.createdBy._id || issue.createdBy, // Recipient
        req.session?.user?._id || issue.assignedTo, // Sender (optional, might be admin)
        'STATUS_UPDATE',
        issue._id,
        `Your issue "${issue.title}" status has been updated to ${status}.`
      );
    }

    // Log Update Status Activity
    if (req.session?.user) {
      logActivity(req.session.user._id || req.session.user.id, 'UPDATE_STATUS', { issueId: issue._id, status: status }, req.ip);
    }

    // Real-time update: broadcast to all connected clients watching issues
    try {
      socketConfig.getIo().to('issues_room').emit('issue_updated', issue);
    } catch (socketErr) {
      console.error('Socket emit error (updateIssueStatus):', socketErr.message);
    }

    res.status(200).json({ message: 'Status updated', issue });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete issue (Admin or creator)
exports.deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findByIdAndDelete(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    // Log Delete Issue Activity
    if (req.session?.user) {
      logActivity(req.session.user._id || req.session.user.id, 'DELETE_ISSUE', { issueId: req.params.id, title: issue.title }, req.ip);
    }

    res.status(200).json({ message: 'Issue deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Display the issue by type
exports.getIssuesByType = async (req, res) => {
  try {
    const { category } = req.params;
    const issues = await Issue.find({ category })
      .populate('createdBy', 'name email mobile location profilePicture')
      .populate('assignedTo', 'name email department mobile location profilePicture');
    res.status(200).json({
      success: true,
      count: issues.length,
      issues
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

//get Issues by User
exports.getIssuesByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const issues = await Issue.find({ createdBy: userId })
      .populate('createdBy', 'name email mobile location profilePicture')
      .populate('assignedTo', 'name email department mobile location profilePicture');
    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user's issues", error });
  }
};


// Get issues by status
exports.getIssuesByStatus = async (req, res) => {
  const { status } = req.params; // status from URL

  try {
    const issues = await Issue.find({ status })
      .populate('createdBy', 'name email mobile location profilePicture')
      .populate('assignedTo', 'name email department mobile location profilePicture');
    if (!issues.length) {
      return res.status(404).json({ success: false, message: 'No issues found with this status' });
    }
    res.status(200).json({
      success: true,
      message: `Issues with status: ${status}`,
      issues
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
};


// // Assign issue to admin (only main admin can assign)
// exports.assignIssueToAdmin = async (req, res) => {
//   const { issueId } = req.params;
//   const { adminId } = req.body;

//   try {
//     // Check if the logged-in user is main admin
//     const loggedInUser = req.user; // set from auth middleware
//     if (!loggedInUser || !loggedInUser.isMainAdmin) {
//       return res.status(403).json({ success: false, message: "Only main admin can assign issues" });
//     }

//     // Find issue by ID
//     const issue = await Issue.findById(issueId);
//     if (!issue) {
//       return res.status(404).json({ success: false, message: 'Issue not found' });
//     }

//     // Check if the issue is already assigned
//     if (issue.assignedTo) {
//       return res.status(400).json({ 
//         success: false, 
//         message: `This issue is already assigned to admin ${issue.assignedTo}` 
//       });
//     }

//     // Check if the admin exists and is an admin
//     const admin = await Users.findById(adminId);
//     if (!admin || admin.role !== 'admin') {
//       return res.status(400).json({ success: false, message: 'Invalid admin ID' });
//     }

//     // Assign the issue
//     issue.assignedTo = adminId;
//     issue.status = 'In Progress'; // optionally update status
//     await issue.save();

//     res.status(200).json({
//       success: true,
//       message: 'Issue assigned to admin successfully',
//       issue
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: 'Server Error', error: err.message });
//   }
// };

/**
 * GET /issue/admins/:department
 * Returns all active dept_admins for a department, each with their current open-issue count.
 * Used by the Super Admin UI when manually reassigning.
 */
exports.getAdminsByDepartment = async (req, res) => {
  try {
    // Only Super Admins may query admins by department
    if (!req.session?.user || req.session.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { department } = req.params;

    const allowedDepartments = Object.values(CATEGORY_TO_DEPARTMENT);
    if (!department || !allowedDepartments.includes(department)) {
      return res.status(400).json({ success: false, message: 'Invalid department' });
    }

    const admins = await Users.find({
      role: 'dept_admin',
      department,
      isBlocked: false
    }).select('_id name email department profilePicture');

    // Attach open-issue count to each admin
    const adminsWithLoad = await Promise.all(
      admins.map(async (admin) => {
        const openCount = await Issue.countDocuments({
          assignedTo: admin._id,
          status: { $ne: 'Resolved' }
        });
        return { ...admin.toObject(), openIssueCount: openCount };
      })
    );

    res.status(200).json({ success: true, admins: adminsWithLoad });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
};

// Assign/Reassign issue to a specific admin (Super Admin only)
exports.assignIssueToAdmin = async (req, res) => {
  const { issueId } = req.params;
  const { adminId } = req.body;
  const adminIdString = adminId ? adminId.toString() : null;

  try {
    // Check if user is logged in via session
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login."
      });
    }

    // Check if the logged-in user is a super admin
    const loggedInUser = req.session.user;
    if (loggedInUser.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: "Only super admin can assign issues"
      });
    }

    // Find issue by ID
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Note: we allow reassignment (overrides previous assignment)

    // Check if the admin exists and is a dept_admin
    const admin = await Users.findById(adminIdString);
    if (!admin || admin.role !== 'dept_admin') {
      return res.status(400).json({
        success: false,
        message: 'Invalid department admin ID'
      });
    }

    // Verify department matches category
    const expectedDepartment = CATEGORY_TO_DEPARTMENT[issue.category];
    if (admin.department !== expectedDepartment) {
      return res.status(400).json({
        success: false,
        message: `Admin's department (${admin.department}) does not match issue category (${issue.category})`
      });
    }

    // Notify the previously assigned admin (if different)
    const previousAdminId = issue.assignedTo ? issue.assignedTo.toString() : null;

    // Assign the issue — do NOT force status to "In Progress".
    // The receiving admin sets that themselves when they start work.
    // If issue was previously unassigned (Pending), keep it Pending.
    issue.assignedTo = adminIdString;
    await issue.save();

    // Notify newly assigned admin
    await createNotification(
      adminIdString,
      req.session.user._id || req.session.user.id,
      'ASSIGNMENT',
      issue._id,
      `Issue "${issue.title}" has been assigned to you.`
    );

    // Notify previously assigned admin if different
    if (previousAdminId && previousAdminId !== adminIdString) {
      await createNotification(
        previousAdminId,
        req.session.user._id || req.session.user.id,
        'ASSIGNMENT',
        issue._id,
        `Issue "${issue.title}" has been reassigned away from you.`
      );
    }

    // Populate the assignedTo field for response
    await issue.populate('assignedTo', 'name email department mobile location profilePicture');
    await issue.populate('createdBy', 'name email mobile location profilePicture');

    // Log Assignment Activity
    logActivity(req.session.user._id || req.session.user.id, 'ASSIGN_ISSUE', { issueId: issue._id, assignedTo: adminId }, req.ip);

    // Real-time update:
    // 1. Tell the newly assigned dept admin their issues changed (they join their user room)
    // 2. If there was a previous admin, tell them too
    // 3. Broadcast global update to super admins watching the issues room
    try {
      const socketIo = socketConfig.getIo();
      socketIo.to(adminIdString).emit('issue_assigned', issue);
      if (previousAdminId && previousAdminId !== adminIdString) {
        socketIo.to(previousAdminId).emit('issue_unassigned', { issueId: issue._id.toString() });
      }
      socketIo.to('issues_room').emit('issue_updated', issue);
    } catch (socketErr) {
      console.error('Socket emit error (assignIssueToAdmin):', socketErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Issue assigned to admin successfully',
      issue
    });
  } catch (err) {
    console.error('Assignment error:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};




// Get all issues assigned to a specific admin
exports.getIssuesByAdmin = async (req, res) => {
  const { adminId } = req.params;

  if (!adminId) {
    return res.status(400).json({ message: "Admin ID is required" });
  }

  try {
    const issues = await Issue.find({ assignedTo: adminId })
      .populate('createdBy', 'name email mobile location profilePicture')
      .populate('assignedTo', 'name email department mobile location profilePicture');

    // Always return 200 — empty array is a valid response (admin has no issues yet)

    res.status(200).json({
      success: true,
      message: `Issues assigned to admin ${adminId} fetched successfully`,
      issues
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};


// Add comment to an issue
// Add comment to an issue
exports.addComment = async (req, res) => {
  const { issueId } = req.params;
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ success: false, message: "User ID and message are required" });
  }

  try {
    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });

    // Add comment
    issue.comments.push({ user: userId, message });
    await issue.save();

    // Determine notification recipient
    // If commenter is the user who created the issue, notify assigned admin (if any)
    // If commenter is admin or anyone else, notify the creator
    const commenterId = userId.toString();
    const creatorId = issue.createdBy ? issue.createdBy.toString() : null;
    const assignedAdminId = issue.assignedTo ? issue.assignedTo.toString() : null;

    if (creatorId && commenterId !== creatorId) {
      // Comment by admin/other -> notify creator
      await createNotification(
        creatorId,
        userId,
        'COMMENT',
        issue._id,
        `New comment on your issue "${issue.title}": ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`
      );
    } else if (assignedAdminId && commenterId !== assignedAdminId) {
      // Comment by creator/other -> notify assigned admin
      await createNotification(
        assignedAdminId,
        userId,
        'COMMENT',
        issue._id,
        `New comment on assigned issue "${issue.title}": ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`
      );
    }

    // Log Comment Activity
    logActivity(userId, 'COMMENT', { issueId: issue._id, comment: message.substring(0, 50) }, req.ip);

    res.status(200).json({
      success: true,
      message: "Comment added successfully",
      comments: issue.comments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

// Get all comments for an issue
exports.getComments = async (req, res) => {
  const { issueId } = req.params;

  try {
    const issue = await Issue.findById(issueId).populate('comments.user', 'name email role');
    if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });

    res.status(200).json({
      success: true,
      comments: issue.comments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  const { issueId, commentId } = req.params;

  try {
    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });

    // Filter out the comment
    issue.comments = issue.comments.filter(c => c._id.toString() !== commentId);
    await issue.save();

    // Re-populate and return updated comments
    const updatedIssue = await Issue.findById(issueId).populate('comments.user', 'name email role');

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
      comments: updatedIssue.comments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

// Edit issue details (title, description, category, location)
exports.editIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, location, priority } = req.body;

    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and category are required"
      });
    }

    // Find the issue
    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found"
      });
    }

    // Optional: Check if the user owns this issue (uncomment if you have user authentication)
    // const { userId } = req.body; // or get from req.user if using auth middleware
    // if (issue.createdBy.toString() !== userId) {
    //   return res.status(403).json({ 
    //     success: false,
    //     message: "Unauthorized to edit this issue" 
    //   });
    // }

    // Update issue fields
    issue.title = title;
    issue.description = description;
    issue.category = category;
    if (priority) issue.priority = priority;

    // Update location if provided
    if (location) {
      if (location.address) {
        issue.location.address = location.address;
      }
      if (location.latitude) {
        issue.location.latitude = parseFloat(location.latitude);
      }
      if (location.longitude) {
        issue.location.longitude = parseFloat(location.longitude);
      }
      if (location.area) {
        issue.location.area = location.area;
      }
      if (location.state) {
        issue.location.state = location.state;
      }
    }

    // Save the updated issue
    const updatedIssue = await issue.save();

    // Log Edit Issue Activity
    if (req.session?.user) {
      logActivity(req.session.user._id || req.session.user.id, 'EDIT_ISSUE', { issueId: updatedIssue._id, title: updatedIssue.title }, req.ip);
    }

    // Populate the createdBy and assignedTo field for consistent response
    await updatedIssue.populate('createdBy', 'name email mobile location profilePicture');
    await updatedIssue.populate('assignedTo', 'name email department mobile location profilePicture');

    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      issue: updatedIssue
    });

  } catch (error) {
    console.error("Error editing issue:", error);
    res.status(500).json({
      success: false,
      message: "Failed to edit issue",
      error: error.message
    });
  }
};

// Escalate or de-escalate an issue (Super Admin only)
exports.escalateIssue = async (req, res) => {
  const { issueId } = req.params;
  const { isEscalated, escalationReason } = req.body;

  try {
    // Check if user is logged in via session
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login."
      });
    }

    // Check if the logged-in user is a super admin
    const loggedInUser = req.session.user;
    if (loggedInUser.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: "Only super admin can escalate issues"
      });
    }

    // Find issue by ID
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Update escalation status
    issue.isEscalated = isEscalated;
    issue.escalationReason = isEscalated ? escalationReason : "";

    // If escalating, set priority to high
    if (isEscalated) {
      issue.priority = 'high';
    }

    await issue.save();

    // Populate fields for response
    await issue.populate('assignedTo', 'name email department mobile location profilePicture');
    await issue.populate('createdBy', 'name email mobile location profilePicture');

    const message = isEscalated
      ? 'Issue escalated successfully'
      : 'Issue de-escalated successfully';

    // Log Escalation Activity
    const activityAction = isEscalated ? 'ESCALATE_ISSUE' : 'DE-ESCALATE_ISSUE';
    logActivity(req.session.user._id || req.session.user.id, activityAction, { issueId: issue._id, reason: escalationReason }, req.ip);

    res.status(200).json({
      success: true,
      message: message,
      issue
    });
  } catch (err) {
    console.error('Escalation error:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// Reassign issue to Super Admin (Department Admin only)
exports.reassignIssue = async (req, res) => {
  const { issueId } = req.params;
  const { reason } = req.body;

  try {
    // Check if user is logged in via session
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login."
      });
    }

    // Check if the logged-in user is a dept_admin
    const loggedInUser = req.session.user;
    if (loggedInUser.role !== 'dept_admin') {
      return res.status(403).json({
        success: false,
        message: "Only department admins can reassign issues"
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reason for reassignment is required"
      });
    }

    // Find issue by ID
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Update issue for reassignment/escalation
    issue.isEscalated = true;
    issue.escalationReason = reason.trim();
    issue.priority = 'high'; // Mark as high priority for attention
    // Optionally unassign or keep assigned but flagged
    // keeping assigned allows tracking who escalated it

    await issue.save();

    // Populate fields for response
    await issue.populate('assignedTo', 'name email department mobile location profilePicture');
    await issue.populate('createdBy', 'name email mobile location profilePicture');

    // Log Reassignment Activity
    logActivity(req.session.user._id || req.session.user.id, 'REASSIGN_ISSUE', { issueId: issue._id, reason: reason }, req.ip);

    res.status(200).json({
      success: true,
      message: 'Issue reassigned to Super Admin successfully',
      issue
    });
  } catch (err) {
    console.error('Reassignment error:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};