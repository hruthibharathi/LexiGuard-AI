LexiGuard AI — Smart Contract Risk Analyzer

LexiGuard AI is a browser-based legal assistance prototype designed to help users identify potentially risky clauses in contracts, understand common legal terms, and generate basic legal document templates.

Built with HTML, CSS, and JavaScript, the project demonstrates how client-side text analysis and rule-based logic can support preliminary contract review without requiring a backend server or API keys.

✨ Features
📄 Contract Analysis
Analyze pasted contract text directly in the browser.
Upload text files for analysis.
Identify potentially risky clauses using predefined rules and keywords.
Display detected clauses, risk categories, severity levels, and review suggestions.
📊 Dynamic Risk Dashboard
View a calculated contract risk score.
Explore risk categories and detected issues.
Visualize analysis results through dynamic dashboard elements.
Review findings generated from the submitted contract text.
💬 Legal Knowledge-Base Chatbot
Ask questions about common legal concepts.
Explore topics such as indemnity, liability, termination, confidentiality, payment terms, and non-disclosure agreements.
Receive answers from a predefined, locally stored knowledge base.
📝 Document Template Generator
Generate basic legal document drafts.
Customize supported templates with relevant party details and purpose.
Download generated documents as text files.
🔒 Privacy-Friendly Architecture
Runs in the user's browser.
Requires no backend server or API keys.
Does not require a database for its core functionality.

Note: Browser-based processing does not automatically guarantee that data is never stored by the browser or shared through other software. Review the implementation and browser environment before entering confidential contracts.

🛠️ Tech Stack
Technology	Purpose
HTML5	Website structure and content
CSS3	Styling, layout, and responsive design
JavaScript	Contract analysis, risk calculations, chatbot responses, and document generation
Browser APIs	Client-side file handling and downloads
🚀 Getting Started
Prerequisites
A modern web browser, such as Google Chrome, Microsoft Edge, or Firefox.
No backend, API key, or package installation is required for the basic website.
Installation

1. Clone the repository

git clone https://github.com/YOUR-USERNAME/LexiGuard-AI.git

Replace YOUR-USERNAME with your GitHub username.

2. Open the project folder

cd LexiGuard-AI

3. Run the website

Open index.html in your browser.

Alternatively, use the Live Server extension in Visual Studio Code for local development.

📁 Project Structure
LexiGuard-AI/
│
├── index.html    # Main website and interface
├── style.css     # Styling and responsive layout
├── script.js     # Analysis logic and interactive features
└── README.md     # Project documentation
🧪 How to Use
Open the website.
Navigate to the contract analyzer.
Paste contract text or upload a supported text file.
Run the analysis to view detected clauses and potential risks.
Explore the risk dashboard to review the results.
Ask the legal chatbot questions about supported legal concepts.
Open the document studio to generate and download a template.
⚙️ How It Works

LexiGuard AI uses a client-side, rule-based approach:

Text input: The user provides contract text.
Text processing: JavaScript examines the text for predefined phrases and patterns.
Clause detection: Matching rules identify potentially relevant clauses.
Risk calculation: The application combines detected issues according to its scoring rules.
Result visualization: The dashboard presents the resulting score, categories, and findings.
Knowledge-base responses: The chatbot matches user questions to predefined legal information.
Document generation: User-provided details are inserted into supported templates for download.

The quality of the output depends on the predefined rules and patterns. The application does not understand contracts in the same way as a trained legal AI model.

🎯 Project Objective

The goal of LexiGuard AI is to demonstrate how accessible web technologies can be used to build an interactive tool for preliminary contract review, legal concept education, and document drafting.

The project emphasizes:

Accessible legal information
Preliminary identification of contractual risks
Interactive data visualization
Browser-based processing
Simple document generation
🔮 Future Improvements

Potential future enhancements include:

Integration with a large language model through a secure backend.
Support for PDF and DOCX contract extraction.
More advanced clause classification and contextual analysis.
Jurisdiction-specific legal references and citations.
Exportable analysis reports.
User accounts and secure document storage.
Improved accessibility and multilingual support.
⚠️ Disclaimer

LexiGuard AI is an educational project and demonstration prototype. It is not a substitute for a qualified lawyer or professional legal advice.

Risk scores and flagged clauses are generated using predefined rules. They may miss important issues, flag harmless language, or fail to account for the relevant jurisdiction and contractual context. A low risk score does not mean a contract is safe, valid, or legally compliant.

Consult a qualified legal professional before signing a contract or making legal decisions.

👩‍💻 Author

Project: LexiGuard AI
Category: Legal Technology (LegalTech)
Implementation: HTML, CSS, and JavaScript
Project Type: Browser-based working prototype