const Issue = require('../Models/IssueModel');
const Users = require('../Models/UserModel');

// FAQs data
const FAQS = [
    {
        id: 1,
        question: "How do I report a new issue?",
        answer: "You can report a new issue by clicking the 'Report Issue' button on your dashboard. Fill in the title, description, category, and location details, then submit. You can also attach an image of the issue."
    },
    {
        id: 2,
        question: "What types of issues can I report?",
        answer: "You can report the following types of issues: Garbage (waste management), Streetlight (broken or missing lights), Pothole (road damage), Water Leakage (pipe or drainage issues), and Other (miscellaneous civic issues)."
    },
    {
        id: 3,
        question: "How long does it take to resolve an issue?",
        answer: "Resolution time varies by issue type and priority. High priority issues are typically addressed within 24-48 hours. Medium priority within 3-5 business days. Low priority may take 1-2 weeks. You'll receive notifications when your issue status changes."
    },
    {
        id: 4,
        question: "What do the different issue statuses mean?",
        answer: "• Pending: Your issue has been received and is awaiting review by an admin.\n• In Progress: An admin has been assigned and is actively working on resolving your issue.\n• Resolved: Your issue has been successfully resolved. You can see the resolution date in the issue details."
    },
    {
        id: 5,
        question: "Can I edit or delete my reported issue?",
        answer: "Yes! You can edit or delete your issue as long as it's still in 'Pending' status. Once an admin starts working on it (In Progress or Resolved), editing/deleting is restricted. Go to your Dashboard and use the Edit or Delete buttons on the issue card."
    },
    {
        id: 6,
        question: "How do I track the status of my issue?",
        answer: "You can track your issue status from your Dashboard or the My Issues page. Each issue card shows the current status. Click 'View Details' on any issue to see the full timeline, assigned admin, and comments."
    },
    {
        id: 7,
        question: "Who will be assigned to handle my issue?",
        answer: "Issues are first reviewed by the Super Admin, who then assigns them to the appropriate Department Admin based on the issue category. For example, a Pothole issue goes to the Potholes department admin, a Garbage issue to the Garbage department admin, etc."
    },
    {
        id: 8,
        question: "How do I contact the admin?",
        answer: "You can use the Contact page to send a message directly to the dept admin or super admin. You can also view their contact details on the Contact page. Select the department admin based on the type of issue you have."
    },
    {
        id: 9,
        question: "Will I get notified when my issue is updated?",
        answer: "Yes! You'll receive in-app notifications when: your issue status changes, an admin comments on your issue, or your issue is assigned to an admin. Check the bell icon in the navbar for notifications."
    },
    {
        id: 10,
        question: "What is issue escalation?",
        answer: "Escalation is when an issue is flagged as high priority due to its critical nature or prolonged pending status. Escalated issues are directly overseen by the Super Admin and get priority treatment."
    },
    {
        id: 11,
        question: "How do I change my account password?",
        answer: "Go to Settings in your dashboard. Click on 'Change Password', enter your current password, then set a new one. For forgotten passwords, use the 'Forgot Password' option on the login page."
    },
    {
        id: 12,
        question: "What should I include when reporting an issue?",
        answer: "For the best results, include: a clear title, a detailed description of the problem, the correct category, your precise location (use the map to pin the exact spot), and an image if possible. More detail helps admins resolve issues faster."
    }
];

// Get all chatbot context data
exports.getChatbotData = async (req, res) => {
    try {
        const [superAdmins, deptAdmins] = await Promise.all([
            Users.find({ role: 'super_admin' }, 'name email mobile department location profilePicture'),
            Users.find({ role: 'dept_admin' }, 'name email mobile department location profilePicture')
        ]);

        res.status(200).json({
            success: true,
            data: {
                superAdmins,
                deptAdmins,
                faqs: FAQS
            }
        });
    } catch (error) {
        console.error('Chatbot data error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Get FAQs only
exports.getFAQs = async (req, res) => {
    res.status(200).json({ success: true, faqs: FAQS });
};

// Get specific issue details and status
exports.getIssueStatusById = async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id)
            .populate('createdBy', 'name email mobile')
            .populate('assignedTo', 'name email mobile department location profilePicture');

        if (!issue) {
            return res.status(404).json({ success: false, message: 'Issue not found' });
        }

        res.status(200).json({
            success: true,
            issue: {
                _id: issue._id,
                title: issue.title,
                description: issue.description,
                category: issue.category,
                status: issue.status,
                priority: issue.priority,
                location: issue.location,
                createdAt: issue.createdAt,
                resolvedAt: issue.resolvedAt,
                isEscalated: issue.isEscalated,
                escalationReason: issue.escalationReason,
                createdBy: issue.createdBy,
                assignedTo: issue.assignedTo
            }
        });
    } catch (error) {
        console.error('Chatbot issue status error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Get contact details
exports.getContactDetails = async (req, res) => {
    try {
        const [superAdmins, deptAdmins] = await Promise.all([
            Users.find({ role: 'super_admin' }, 'name email mobile location profilePicture'),
            Users.find({ role: 'dept_admin' }, 'name email mobile department location profilePicture')
        ]);

        res.status(200).json({
            success: true,
            contacts: {
                superAdmins,
                deptAdmins
            }
        });
    } catch (error) {
        console.error('Chatbot contacts error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
