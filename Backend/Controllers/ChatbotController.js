const Issue = require('../Models/IssueModel');
const Users = require('../Models/UserModel');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini at Module level for efficiency
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
        answer: "Issues are automatically and directly assigned to the relevant Department Admin based on the category you choose. For example, a 'Pothole' report goes directly to the Potholes department admin for instant action. There is no manual review delay."
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
        question: "What is misrouting in the system?",
        answer: "An issue is marked as 'Misrouted' if it was assigned to the wrong department (e.g., reporting a pothole under garbage). In such cases, the department admin flags it to the Super Admin, who then redirects it to the correct department for resolution."
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
                isReassignedToSuper: issue.isReassignedToSuper,
                reassignmentReason: issue.reassignmentReason,
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

// Helper to sanitize history for Gemini (must start with user, alternate roles, and end with model)
const sanitizeHistory = (history) => {
    if (!history || history.length === 0) return [];

    let sanitized = [...history];

    // Must start with 'user' role
    while (sanitized.length > 0 && sanitized[0].role !== 'user') {
        sanitized.shift();
    }

    // Must alternate user → model → user → model
    const alternated = sanitized.reduce((acc, msg) => {
        const lastRole = acc[acc.length - 1]?.role;
        if (msg.role !== lastRole) acc.push(msg);
        return acc;
    }, []);

    // Must end with 'model' (last exchange must be complete)
    while (alternated.length > 0 && alternated[alternated.length - 1].role !== 'model') {
        alternated.pop();
    }

    return alternated;
};

// AI Chatbot Integration with Automatic Fallback
exports.chatWithAI = async (req, res) => {
    const MODELS = [
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.5-pro",
    ];

    try {
        const { message, history } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ success: false, message: 'AI API key not configured' });
        }

        // Fetch context (FAQs and Admins) to feed to AI
        const [superAdmins, deptAdmins] = await Promise.all([
            Users.find({ role: 'super_admin' }, 'name email mobile department'),
            Users.find({ role: 'dept_admin' }, 'name email mobile department')
        ]);

        const systemPrompt = `
You are "CivBot", a helpful and polite AI civic assistant for the "Civic Issue Reporting & Resolution System".
Your role is to assist citizens in reporting issues, tracking their status, and understanding how the system works.

═══════════════════════════════════════════
📌 HOW THE SYSTEM WORKS (ACTUAL FLOW)
═══════════════════════════════════════════

1. ISSUE REPORTING:
   - A citizen logs in and submits an issue with a title, description, category, location, and optional photo.
   - The issue is AUTOMATICALLY assigned to the relevant Department Admin based on the issue category.
   - There is NO super admin approval step — assignment is instant and automatic.
   - Example: A "Pothole" issue goes directly to the Roads/Potholes department admin.

2. ISSUE STATUSES:
   - "Pending"     → Issue submitted, waiting for department admin to start working on it.
   - "In Progress" → Department admin has accepted and is actively resolving the issue.
   - "Resolved"    → Department admin has marked the issue as fixed with resolution notes.

3. CITIZEN PERMISSIONS:
   - Can report an issue with location and photo.
   - Can track the live status of their reported issues.
   - Can comment on their issues.
   - Can DELETE their issue ONLY if it is still in "Pending" status (not yet accepted by admin).
   - Once the issue is "In Progress" or "Resolved", the citizen CANNOT edit or delete it.
   - Receives in-app notifications when their issue status changes.

4. DEPARTMENT ADMIN PERMISSIONS:
   - Can view only the issues assigned to their specific department.
   - Can update issue status: Pending → In Progress → Resolved.
   - Can add resolution notes/comments when resolving an issue.
   - Can reassign an issue to a different department if it was wrongly categorized.

5. SUPER ADMIN PERMISSIONS:
   - Can manage all users (citizens and department admins).
   - Can create, update, or remove department admins.
   - Can view all issues across all departments.
   - Can generate reports and analytics on issue resolution.
   - Can override or reassign any issue regardless of department.

═══════════════════════════════════════════
📌 CONTEXT DATA (LIVE FROM DATABASE)
═══════════════════════════════════════════

- FAQs: ${JSON.stringify(FAQS)}
- Super Admins: ${JSON.stringify(superAdmins)}
- Department Admins: ${JSON.stringify(deptAdmins)}

═══════════════════════════════════════════
📌 YOUR INSTRUCTIONS AS CIVBOT
═══════════════════════════════════════════

1. Always answer based on the ACTUAL SYSTEM FLOW described above.
2. Use the FAQs to answer common questions when relevant.
3. If a user asks who to contact, refer to the admin details from the lists above.
4. If a user asks about issue tracking, guide them to log in and visit "My Issues" section on the portal.
5. If a user asks about deleting/editing an issue:
   - If status is "Pending" → they CAN delete it.
   - If status is "In Progress" or "Resolved" → they CANNOT edit or delete it.
6. Never say "Super Admin reviews your issue first" — assignment is automatic by category.
7. Do not make up issue IDs, statuses, or admin names not present in the context data.
8. Be professional, empathetic, and concise. Avoid technical jargon.
9. If you don't know the answer, politely ask the user to contact a Super Admin from the list above.
10. Never reveal internal system details like database names, API keys, or backend logic.

═══════════════════════════════════════════
📌 EXAMPLE Q&A (FOR YOUR REFERENCE)
═══════════════════════════════════════════

Q: How will my issue reach the admin?
A: Once you submit your issue, it is automatically assigned to the relevant department admin based on the category you selected. No manual review is needed — it's instant!

Q: Can I delete my issue after submitting?
A: Yes, but only if your issue is still in "Pending" status. Once an admin starts working on it (In Progress), you can no longer edit or delete it.

Q: How do I track my issue?
A: Log in to the portal, go to "My Issues" section, and you can see the live status of all your reported issues along with any updates from the department.

Q: Who handles garbage-related issues?
A: Garbage issues are automatically assigned to the Garbage/Sanitation department admin. You can also contact them directly — check the admin list above.
`;

        const sanitizedHistory = sanitizeHistory(history);
        let lastError = null;

        // Try models one by one
        for (const modelName of MODELS) {
            try {
                const timestamp = new Date().toLocaleTimeString();
                console.log(`\x1b[36m[${timestamp}]\x1b[0m 🚀 \x1b[1mAI REQUEST\x1b[0m | Model: \x1b[33m${modelName}\x1b[0m | Msg: "${message.substring(0, 30)}..."`);
                
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    systemInstruction: systemPrompt
                });

                const chat = model.startChat({
                    history: sanitizedHistory,
                    generationConfig: { maxOutputTokens: 1000 },
                });

                const result = await chat.sendMessage(message);
                const response = await result.response;
                const text = response.text();

                // Log final successful model
                console.log(`\x1b[32m[${timestamp}]\x1b[0m ✅ \x1b[1mAI SUCCESS\x1b[0m | Model: \x1b[33m${modelName}\x1b[0m`);

                // If success, return immediately
                return res.status(200).json({
                    success: true,
                    response: text,
                    model: modelName
                });

            } catch (err) {
                // Check if it's a retryable error (Quota or Service Busy)
                const isRetryableError =
                    err.message?.includes('429') ||
                    err.message?.includes('quota') ||
                    err.message?.includes('RESOURCE_EXHAUSTED') ||
                    err.message?.includes('503') ||
                    err.message?.includes('Service Unavailable') ||
                    err.status === 429 ||
                    err.status === 503;

                if (isRetryableError) {
                    console.warn(`⚠️  ${modelName} transient error — attempting fallback...`);
                    lastError = err;
                    continue; // Try next model in loop
                } else {
                    // It's a real error (not retryable) — fail immediately
                    throw err;
                }
            }
        }

        // if all models fail
        throw new Error(`AI Service currently overloaded (All fallback models exhausted). Last error: ${lastError?.message || 'Unknown'}`);

    } catch (error) {
        console.error('Final AI Chat Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'AI Service currently overloaded. Please try again in a few moments.', 
            error: error.message 
        });
    }
};
