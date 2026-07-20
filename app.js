document.addEventListener('DOMContentLoaded', () => {
  // --- FIREBASE CONFIGURATION ---
  const firebaseConfig = {
    apiKey: "AIzaSyDT3-1lTXSxxiyzmR3avo7Dw_AW_nW3ZgU",
    authDomain: "find-ur-career.firebaseapp.com",
    projectId: "find-ur-career",
    storageBucket: "find-ur-career.firebasestorage.app",
    messagingSenderId: "346201764246",
    appId: "1:346201764246:web:3287d54ebe067738afedb7",
    measurementId: "G-FKZEP00HDL"
  };

  let db = null;
  let auth = null;
  let useFirebase = false;

  if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    try {
      firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
      auth = firebase.auth();
      useFirebase = true;
      console.log("Pathfinder: Firebase initialized successfully (Cloud Mode).");
    } catch (err) {
      console.error("Pathfinder: Firebase initialization failed. Falling back.", err);
    }
  } else {
    console.log("Pathfinder: Firebase config not found. Running in LocalStorage Mode.");
  }

  // --- USER SESSION MANAGEMENT ---
  let activeEmail = localStorage.getItem('pathfinder_active_email');
  let usersDb = JSON.parse(localStorage.getItem('pathfinder_users') || '{}');

  let state = {
    currentTab: 'home',
    userXP: 0,
    completedModules: [],
    bookmarkedCareers: [],
    quizAnswers: {},
    quizCurrentQuestion: 0,
    activeSkillId: null,
    language: 'en',
    authMode: localStorage.getItem('pathfinder_auth_mode') || 'firebase'
  };

  function loadUserState(email, dataObj = null) {
    if (dataObj) {
      state.userXP = dataObj.userXP || 0;
      state.completedModules = dataObj.completedModules || [];
      state.bookmarkedCareers = dataObj.bookmarkedCareers || [];
      state.quizAnswers = {};
      state.quizCurrentQuestion = 0;
      updateUIForUser(email, dataObj.profile);
      updateXPBadge();
      setupPortfolio();
      return;
    }

    if (useFirebase && state.authMode === 'firebase' && activeEmail) {
      db.collection('users').doc(email).get().then(userDoc => {
        const profile = userDoc.exists ? userDoc.data() : { name: 'Student', age: 'N/A', email };
        db.collection('states').doc(email).get().then(stateDoc => {
          const userState = stateDoc.exists ? stateDoc.data() : { userXP: 0, completedModules: [], bookmarkedCareers: [] };

          state.userXP = userState.userXP || 0;
          state.completedModules = userState.completedModules || [];
          state.bookmarkedCareers = userState.bookmarkedCareers || [];
          state.quizAnswers = {};
          state.quizCurrentQuestion = 0;

          updateUIForUser(email, profile);
          updateXPBadge();
          setupPortfolio();
        });
      }).catch(err => {
        console.error("Error loading user state from Firebase:", err);
      });
      return;
    }

    const userState = JSON.parse(localStorage.getItem(`pathfinder_state_${email}`) || '{}');
    state.userXP = userState.userXP || 0;
    state.completedModules = userState.completedModules || [];
    state.bookmarkedCareers = userState.bookmarkedCareers || [];
    state.quizAnswers = {};
    state.quizCurrentQuestion = 0;

    const user = usersDb[email] || { name: 'Guest Student', age: 'N/A', email: 'guest@example.com' };
    updateUIForUser(email, user);
    updateXPBadge();
    setupPortfolio();
  }

  function updateUIForUser(email, userObj) {
    const initials = userObj.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    const avatarBadge = document.getElementById('user-avatar-lbl');
    const avatarCircle = document.getElementById('portfolio-avatar-circle');
    if (avatarBadge) avatarBadge.textContent = initials || 'S';
    if (avatarCircle) avatarCircle.textContent = initials || 'S';

    const dropdownName = document.getElementById('dropdown-user-name');
    const dropdownEmail = document.getElementById('dropdown-user-email');
    const dropdownAge = document.getElementById('dropdown-user-age');
    const portfolioTitle = document.getElementById('portfolio-user-title');
    const feedbackName = document.getElementById('feedback-name');

    if (dropdownName) dropdownName.textContent = userObj.name;
    if (dropdownEmail) dropdownEmail.textContent = userObj.email;
    if (dropdownAge) dropdownAge.textContent = userObj.age;
    if (portfolioTitle) portfolioTitle.textContent = userObj.name;
    if (feedbackName && userObj.name && userObj.name !== 'Guest Student') {
      feedbackName.value = userObj.name;
    }
  }

  if (activeEmail) {
    loadUserState(activeEmail);
  }

  // --- DATA REFERENCE ---
  const appData = window.appData;

  // --- DOM ELEMENTS ---
  const navItems = document.querySelectorAll('.nav-item');
  const viewPanels = document.querySelectorAll('.view-panel');
  const xpBadge = document.getElementById('user-xp-val');
  const logo = document.getElementById('navbar-logo');

  // Modal elements
  const modalOverlay = document.getElementById('modal-overlay');
  const modalClose = document.getElementById('modal-close');
  const modalBody = document.getElementById('modal-body');

  // --- UI TRANSLATION DICTIONARY ---
  const translations = {
    en: {
      nav_home: "Home",
      nav_quiz: "Career Assessment",
      nav_explorer: "Career Explorer",
      nav_skills: "Skills Hub",
      nav_advisor: "AI Advisor",
      nav_portfolio: "My Portfolio",
      nav_feedback: "Reviews & Suggestions",
      nav_more: "More ▾",
      
      hero_title: "Shape Your Future & Learn Real-World Skills",
      hero_subtitle: "Confused about what career is right for you? Take our AI-backed career assessment, explore in-demand careers, track skill milestones, and chat with an advisor.",
      hero_btn_quiz: "Find Your Match",
      hero_btn_skills: "Start Learning",
      
      card_assessment_title: "🎯 Match Interests",
      card_assessment_desc: "Uncover which career fits your mindset, values, and problem-solving style by taking our interest assessment.",
      card_skills_title: "🧭 Career Explorer",
      card_skills_desc: "Browse growth statistics, salaries, details, and step-by-step career path guides for in-demand roles.",
      card_advisor_title: "🛠️ Skill Milestones",
      card_advisor_desc: "Earn XP by starting guided visual learning roadmaps in Web Dev, Figma Design, or Python Data Science.",
      
      quiz_title: "Career Match Quiz",
      quiz_desc: "Answer 4 simple questions about your favorite activities, work environments, and subjects to unlock your personalized recommendation dashboard.",
      quiz_start: "Start Assessment",
      
      explorer_title: "Career Explorer",
      explorer_desc: "Discover path guidelines, entry-level salaries, and growth projections.",
      explorer_search_placeholder: "Search careers (e.g. software, designer)...",
      explorer_filter_all: "All Categories",
      explorer_filter_tech: "Technology",
      explorer_filter_creative: "Creative & Design",
      explorer_filter_business: "Business & Marketing",
      explorer_filter_science: "Biotech & Science",
      
      skills_title: "Modular Skills Hub",
      skills_desc: "Launch structured tracks, verify your progress, and level up your portfolio.",
      
      advisor_title: "AI Career Advisor",
      advisor_desc: "Chat with our simulated advisor to get instant tips on careers, salaries, and roadmaps.",
      advisor_chat_placeholder: "Type a message (e.g. 'coding', 'UX design', 'AI')...",
      advisor_send: "Send",
      advisor_suggested: "💡 Ask About...",
      
      portfolio_xp_rank: "Student Account Dashboard",
      portfolio_completed: "Completed Milestones",
      portfolio_bookmarked: "⭐ Bookmarked Career Paths",
      
      reviews_title: "Reviews & Suggestions",
      reviews_desc: "Share your learning experience, rate the platform, or suggest new roadmap features.",
      reviews_write: "Write a Review",
      reviews_name_lbl: "Your Name",
      reviews_rating_lbl: "Your Rating",
      reviews_text_lbl: "Review or Suggestion",
      reviews_placeholder: "What do you think of the pathways? What features should we add next?...",
      reviews_submit: "Submit Review",
      reviews_community: "Community Reviews & Suggestions",
      
      profile_logout: "Sign Out",
      profile_age: "Age",
      profile_guest: "Guest Student",
      prompt_coding: '"How do I start in coding?"',
      prompt_ux: '"What are the skills for UX design?"',
      prompt_ai: '"Tell me about AI careers"',
      prompt_salary: '"What salaries do tech roles pay?"'
    },
    hi: {
      nav_home: "होम (Home)",
      nav_quiz: "करियर आकलन",
      nav_explorer: "करियर खोजें (Explorer)",
      nav_skills: "कौशल हब",
      nav_advisor: "एआई सलाहकार",
      nav_portfolio: "मेरा पोर्टफोलियो",
      nav_feedback: "समीक्षा और सुझाव",
      nav_more: "और अधिक ▾",
      
      hero_title: "अपने भविष्य को आकार दें और कौशल सीखें",
      hero_subtitle: "उलझन में हैं कि कौन सा करियर आपके लिए सही है? हमारा एआई-आधारित करियर आकलन लें, मांग वाले करियर का पता लगाएं, कौशल मील के पत्थर ट्रैक करें, और एक सलाहकार के साथ चैट करें।",
      hero_btn_quiz: "अपना मैच खोजें",
      hero_btn_skills: "सीखना शुरू करें",
      
      card_assessment_title: "🎯 रुचियों का मिलान करें",
      card_assessment_desc: "हमारे रुचि मूल्यांकन को लेकर पता लगाएं कि कौन सा करियर आपकी मानसिकता, मूल्यों और समस्या सुलझाने की शैली से मेल खाता है।",
      card_skills_title: "🧭 करियर खोजकर्ता",
      card_skills_desc: "मांग वाली भूमिकाओं के लिए विकास के आंकड़े, वेतन, विवरण और चरण-दर-चरण करियर पथ गाइड ब्राउज़ करें।",
      card_advisor_title: "🛠️ कौशल मील के पत्थर",
      card_advisor_desc: "वेब देव, फिग्मा डिज़ाइन, या पायथन डेटा साइंस में निर्देशित दृश्य शिक्षण रोडमैप शुरू करके XP अर्जित करें।",
      
      quiz_title: "करियर मिलान प्रश्नोत्तरी",
      quiz_desc: "अपने व्यक्तिगत अनुशंसा डैशबोर्ड को अनलॉक करने के लिए अपनी पसंदीदा गतिविधियों, कार्य वातावरण और विषयों के बारे में 4 सरल प्रश्नों के उत्तर दें।",
      quiz_start: "मूल्यांकन शुरू करें",
      
      explorer_title: "करियर खोजकर्ता (Explorer)",
      explorer_desc: "पथ दिशानिर्देश, प्रवेश स्तर के वेतन और विकास अनुमानों की खोज करें।",
      explorer_search_placeholder: "करियर खोजें (जैसे सॉफ्टवेयर, डिजाइनर)...",
      explorer_filter_all: "सभी श्रेणियां",
      explorer_filter_tech: "प्रौद्योगिकी (Technology)",
      explorer_filter_creative: "रचनात्मक और डिजाइन",
      explorer_filter_business: "व्यवसाय और विपणन",
      explorer_filter_science: "बायोटेक और विज्ञान",
      
      skills_title: "मॉड्यूलर कौशल हब",
      skills_desc: "संरचित ट्रैक लॉन्च करें, अपनी प्रगति सत्यापित करें, और अपने पोर्टफोलियो को स्तर दें।",
      
      advisor_title: "एआई करियर सलाहकार",
      advisor_desc: "करियर, वेतन and रोडमैप पर त्वरित सुझाव प्राप्त करने के लिए हमारे एआई सलाहकार के साथ चैट करें।",
      advisor_chat_placeholder: "एक संदेश टाइप करें (जैसे 'कोडिंग', 'यूएक्स डिजाइन', 'एआई')...",
      advisor_send: "भेजें",
      advisor_suggested: "💡 इनके बारे में पूछें...",
      
      portfolio_xp_rank: "छात्र खाता डैशबोर्ड",
      portfolio_completed: "पूरे किए गए मील के पत्थर",
      portfolio_bookmarked: "⭐ बुकमार्क किए गए करियर पथ",
      
      reviews_title: "समीक्षा और सुझाव",
      reviews_desc: "अपने सीखने के अनुभव को साझा करें, मंच को रेट करें, या नई रोडमैप सुविधाओं का सुझाव दें।",
      reviews_write: "समीक्षा लिखें",
      reviews_name_lbl: "आपका नाम",
      reviews_rating_lbl: "आपकी रेटिंग",
      reviews_text_lbl: "समीक्षा या सुझाव",
      reviews_placeholder: "आप इन करियर पथों के बारे में क्या सोचते हैं? हमें आगे कौन सी सुविधाएं जोड़नी चाहिए?...",
      reviews_submit: "समीक्षा सबमिट करें",
      reviews_community: "सामुदायिक समीक्षाएं और सुझाव",
      
      profile_logout: "लॉग आउट करें",
      profile_age: "उम्र",
      profile_guest: "अतिथि छात्र",
      prompt_coding: '"मैं कोडिंग में शुरुआत कैसे करूं?"',
      prompt_ux: '"UX डिज़ाइन के लिए क्या कौशल चाहिए?"',
      prompt_ai: '"AI करियर के बारे में बताएं"',
      prompt_salary: '"टेक नौकरियों में कितना वेतन मिलता है?"'
    }
  };

  const skillTranslations = {
    "Python for Beginners (100 Days of Code)": "शुरुआती लोगों के लिए पायथन (100 दिन का कोड)",
    "Java for Beginners (Java Full Course 2026)": "शुरुआती लोगों के लिए जावा (जावा फुल कोर्स 2026)",
    "Python for Beginners(English version)": "शुरुआती लोगों के लिए पायथन (अंग्रेजी संस्करण)",
    "C++ Programming (Gate Smashers)": "C++ प्रोग्रामिंग (गेट स्मैशर्स)",
    "Arduino for Beginners": "शुरुआती लोगों के लिए अरुडिनो",
    "JavaScript Full Course": "जावास्क्रिप्ट फुल कोर्स",
    "Web Development Full Course": "वेब डेवलपमेंट फुल कोर्स",
    "Web Development Bootcamp (Delta Course)": "वेब डेवलपमेंट बूटकैंप (डेल्टा कोर्स)",
    "React.js Mastery Course": "रिएक्ट.जेएस मास्टरी कोर्स",
    "Database Management (DBMS) & SQL": "डेटाबेस प्रबंधन (DBMS) और SQL",
    "Data Structures & Algorithms (DSA)": "डेटा स्ट्रक्चर्स एंड एल्गोरिथम्स (DSA)",
    "Machine Learning with Python": "पायथन के साथ मशीन लर्निंग"
  };

  const careerTranslations = {
    // Tech
    "Software Engineer": {
      title: "सॉफ्टवेयर इंजीनियर",
      shortDesc: "सॉफ़्टवेयर अनुप्रयोगों और कंप्यूटर प्रणालियों का डिज़ाइन, निर्माण और रखरखाव करें।",
      desc: "सॉफ्टवेयर इंजीनियर तकनीकी समस्याओं को हल करने के लिए प्रोग्रामिंग और इंजीनियरिंग सिद्धांतों का उपयोग करते हैं। वे ऐप्स लिखते हैं, कोड का परीक्षण करते हैं और टीमों के साथ मिलकर काम करते हैं।"
    },
    "AI & Machine Learning Engineer": {
      title: "AI और मशीन लर्निंग इंजीनियर",
      shortDesc: "कंप्यूटर को डेटा से सीखने की अनुमति देने वाले एल्गोरिदम और मॉडल बनाएं।",
      desc: "एआई विशेषज्ञ न्यूरल नेटवर्क और मशीन लर्निंग मॉडल विकसित करते हैं। वे चैटबॉट्स, लार्ज लैंग्वेज मॉडल्स और ऑटोमैटिक ड्राइविंग सिस्टम पर काम करते हैं।"
    },
    "Cybersecurity Analyst": {
      title: "साइबर सुरक्षा विश्लेषक",
      shortDesc: "नेटवर्क, सिस्टम और डिजिटल संपत्तियों को अनधिकृत पहुंच या साइबर हमलों से बचाएं।",
      desc: "साइबर सुरक्षा विश्लेषक सुरक्षा उल्लंघनों की निगरानी करते हैं, पैठ परीक्षण करते हैं और संगठनों के नेटवर्क की रक्षा के लिए सुरक्षा प्रोटोकॉल लागू करते हैं।"
    },
    "Cloud Architect": {
      title: "क्लाउड आर्किटेक्ट",
      shortDesc: "स्केलेबिलिटी और विश्वसनीयता के लिए क्लाउड कंप्यूटिंग बुनियादी ढांचे का डिज़ाइन और प्रबंधन करें।",
      desc: "क्लाउड आर्किटेक्ट व्यवसायों की आवश्यकताओं के अनुसार सुरक्षित और कुशल क्लाउड नेटवर्क स्थापित करते हैं, जैसे AWS, Azure, या Google Cloud।"
    },
    "Data Engineer": {
      title: "डेटा इंजीनियर",
      shortDesc: "डेटा आर्किटेक्चर, पाइपलाइनों और गोदामों (Warehouses) का निर्माण और रखरखाव करें।",
      desc: "डेटा इंजीनियर उन प्रणालियों का निर्माण करते हैं जो कच्चे डेटा को एकत्र, परिवर्तित और व्यवस्थित करती हैं ताकि डेटा वैज्ञानिक उसका उपयोग कर सकें।"
    },
    "DevOps Engineer": {
      title: "डेवऑप्स इंजीनियर",
      shortDesc: "सॉफ्टवेयर शिपिंग पाइपलाइनों को सुव्यवस्थित करने के लिए विकास और सिस्टम संचालन को जोड़ें।",
      desc: "डेवऑप्स इंजीनियर निरंतर एकीकरण और परिनियोजन (CI/CD) की निगरानी करते हैं और कोड रिलीज प्रक्रियाओं को स्वचालित करते हैं।"
    },
    "Mobile App Developer": {
      title: "मोबाइल ऐप डेवलपर",
      shortDesc: "iOS और Android mobile उपकरणों के लिए मूल या क्रॉस-प्लेटफ़ॉर्म एप्लिकेशन बनाएं।",
      desc: "मोबाइल डेवलपर्स स्मार्टफोन और टैबलेट के लिए यूजर इंटरफेस डिजाइन करते हैं, एपीआई (APIs) का निर्माण करते हैं और प्रदर्शन को अनुकूलित करते हैं।"
    },
    "Full Stack Developer": {
      title: "फुल स्टैक डेवलपर",
      shortDesc: "वेबसाइटों के फ्रंटएंड क्लाइंट इंटरफेस और बैकएंड सर्वर डेटाबेस दोनों को कोड करें।",
      desc: "फुल स्टैक डेवलपर्स यूजर इंटरफेस डिजाइन से लेकर सर्वर लॉजिस्टिक्स, डेटाबेस स्कीमा और होस्टिंग तक वेबसाइट के सभी हिस्सों पर काम करते।"
    },
    "Database Administrator": {
      title: "डेटाबेस प्रशासक",
      shortDesc: "रिलेशनल डेटाबेस को सुव्यवस्थित, सुरक्षित और प्रबंधित करें ताकि उच्च उपलब्धता बनी रहे।",
      desc: "डेटाबेस प्रशासक बैकअप लेते हैं, डेटाबेस क्वेरी को अनुकूलित करते हैं और सुनिश्चित करते हैं कि भंडारण कुशल और सुरक्षित है।"
    },
    "System Administrator": {
      title: "시스템 प्रशासक",
      shortDesc: "कंप्यूटर सर्वर हार्डवेयर, ऑपरेटिंग सिस्टम और नेटवर्क सेवाओं का रखरखाव करें।",
      desc: "सिस्टम एडमिनिस्ट्रेटर कंप्यूटर सिस्टम, ओएस इंस्टॉलेशन, पासवर्ड पॉलिसी और आईटी नेटवर्क का दैनिक संचालन सुनिश्चित करते हैं।"
    },
    "Blockchain Developer": {
      title: "ब्लॉकचेन डेवलपर",
      shortDesc: "स्मार्ट कॉन्ट्रैक्ट्स और विकेंद्रीकृत प्रोटोकॉल का डिज़ाइन और निर्माण करें।",
      desc: "ब्लॉकचेन डेवलपर्स क्रिप्टोग्राफिक लेजर विकसित करते हैं और ब्लॉकचेन नेटवर्क पर चलने वाले विकेंद्रीकृत एप्लिकेशन (dApps) बनाते हैं।"
    },
    "Game Developer": {
      title: "गेम डेवलपर",
      shortDesc: "सॉफ़्टवेयर लूप और गणितीय गणनाएं लिखें जो वीडियो गेम को शक्ति प्रदान करती हैं।",
      desc: "गेम डेवलपर्स गेम इंजन (जैसे Unity या Unreal) का उपयोग करके भौतिकी, चरित्र नियंत्रण, एआई और गेमप्ले लॉजिक को प्रोग्राम करते हैं।"
    },
    "QA Automation Engineer": {
      title: "QA ऑटोमेशन इंजीनियर",
      shortDesc: "सॉफ्टवेयर की विश्वसनीयता सुनिश्चित करने और बग्स की जांच करने के लिए स्वचालित परीक्षण स्क्रिप्ट लिखें।",
      desc: "क्यूए इंजीनियर यह जांचने के लिए परीक्षण उपकरण लिखते हैं कि सॉफ़्टवेयर रिलीज से पहले सही तरीके से काम कर रहा है या नहीं।"
    },

    // Creative
    "UX/UI Designer": {
      title: "UX/UI डिजाइनर",
      shortDesc: "वेबसाइटों और मोबाइल अनुप्रयोगों के लिए सहज ज्ञान युक्त, उपयोगकर्ता के अनुकूल डिजिटल इंटरफ़ेस डिज़ाइन करें।",
      desc: "UX/UI डिज़ाइनर डिजिटल उत्पादों के रूप और अनुभव पर ध्यान केंद्रित करते हैं। वे वायरफ्रेम बनाते हैं और एक सहज अनुभव प्रदान करते हैं।"
    },
    "Graphic Designer": {
      title: "ग्राफिक डिजाइनर",
      shortDesc: "विचारों को संप्रेषित करने के लिए विज़ुअल कॉन्सेप्ट और कला डिज़ाइनों का निर्माण करें।",
      desc: "ग्राफिक डिजाइनर ब्रांड पहचान विकसित करते हैं। वे लोगो, विज्ञापन सामग्री, पत्रिकाओं और पैकेजिंग का लेआउट तैयार करते हैं।"
    },
    "3D Animator": {
      title: "3D एनिमेटर",
      shortDesc: "फिल्मों, खेलों और वेब मीडिया के लिए विज़ुअल प्रभाव, मॉडल और एनिमेशन बनाएं।",
      desc: "3D एनिमेटर त्रि-आयामी पात्रों, वातावरण और डिजिटल मॉडलों को गति प्रदान करते हैं।"
    },
    "Video Editor": {
      title: "वीडियो एडिटर",
      shortDesc: "रिकॉर्ड किए गए फुटेज, ऑडियो ट्रैक और ग्राफिक्स को पॉलिश किए गए वीडियो प्रोजेक्ट्स में असेंबल करें।",
      desc: "वीडियो एडिटर फिल्मों, विज्ञापनों और सोशल मीडिया के लिए वीडियो क्लिप्स को ट्रिम, सिंक और कंपोज करते हैं।"
    },
    "Game Designer": {
      title: "गेम डिजाइनर",
      shortDesc: "वीडियो गेम के नियमों, यांत्रिकी, कहानियों और स्तरों (Levels) की रूपरेखा तैयार करें।",
      desc: "गेम डिज़ाइनर गेमप्ले की शैली, दुनिया के नक्शे, चरित्रों की कहानियाँ और खिलाड़ी की चुनौतियों का निर्माण करते हैं।"
    },
    "Art Director": {
      title: "आर्ट डायरेक्टर",
      shortDesc: "विज्ञापन, प्रकाशनों और फिल्मों के लिए विज़ुअल स्टाइल और डिज़ाइन निर्देशों का नेतृत्व करें।",
      desc: "आर्ट डायरेक्टर विज़ुअल मीडिया परियोजनाओं में कलात्मक दृष्टिकोण और शैलीगत दिशा का प्रबंधन और निर्देशन करते हैं।"
    },
    "Fashion Designer": {
      title: "फैशन डिजाइनर",
      shortDesc: "कपड़ों, जूतों और फैशन एक्सेसरीज के स्केच, निर्माण और प्रोटोटाइप तैयार करें।",
      desc: "फैशन डिज़ाइनर नए परिधानों और कपड़ों के पैटर्न का स्केच बनाते हैं, कपड़े चुनते हैं और नए फैशन उत्पाद बनाते हैं।"
    },
    "Interior Designer": {
      title: "इंटीरियर डिजाइनर",
      shortDesc: "कार्यात्मक, सुरक्षित और सुंदर इनडोर स्थानों (कमरों, कार्यालयों) की योजना और डिज़ाइन बनाएं।",
      desc: "इंटीरियर डिज़ाइनर फर्नीचर की व्यवस्था, रंग योजनाओं और इनडोर वास्तुकला की सुरक्षा सुनिश्चित करते हैं।"
    },
    "Motion Graphics Designer": {
      title: "मोशन ग्राफिक्स डिजाइनर",
      shortDesc: "एनिमेशन, टेक्स्ट और विज़ुअल प्रभावों के माध्यम से ग्राफिक डिज़ाइनों में गति का समावेश करें।",
      desc: "मोशन डिज़ाइनर लोगो, विज्ञापन और वेब व्याख्याताओं के लिए गतिशील एनिमेशन और वीडियो क्लिप बनाते हैं।"
    },
    "Web Designer": {
      title: "वेब डिजाइनर",
      shortDesc: "इंटरैक्टिव वेबसाइटों के लेआउट, संरचना और दृश्य स्वरूप का डिज़ाइन तैयार करें।",
      desc: "वेब डिज़ाइनर मॉकअप बनाते हैं, लेआउट का खाका तैयार करते हैं और यह सुनिश्चित करते हैं कि वेबसाइट मोबाइल और पीसी दोनों पर सुंदर दिखे।"
    },
    "Brand Designer": {
      title: "ब्रांड डिजाइनर",
      shortDesc: "कॉर्पोरेट पहचान के लिए लोगो, विज़ुअल स्टाइल गाइड और ब्रांड विनिर्देशों का निर्माण करें।",
      desc: "ब्रांड डिज़ाइनर कंपनियों के लिए लोगो, टाइपोग्राफी नियम, आइकन सेट और सुसंगत विज़ुअल ब्रांडिंग मैनुअल बनाते हैं।"
    },
    "Creative Copywriter": {
      title: "क्रिएटिव कॉपीराइटर",
      shortDesc: "ब्रांडों को बढ़ावा देने के लिए आकर्षक विज्ञापन पाठ, नारे और उत्पाद विवरण लिखें।",
      desc: "कॉपीराइटर वीडियो स्क्रिप्ट, सोशल मीडिया पोस्ट, विज्ञापनों और ईमेल अभियानों के लिए रचनात्मक सामग्री लिखते हैं।"
    },
    "Sound Designer": {
      title: "Sound डिजाइनर",
      shortDesc: "फिल्मों, खेलों और मीडिया के लिए ध्वनि प्रभाव और ऑडियो ट्रैक रिकॉर्ड, जनरेट और संपादित करें।",
      desc: "Sound डिज़ाइनर डिजिटल ऑडियो स्टेशनों का उपयोग करके पृष्ठभूमि संगीत, ध्वनि प्रभाव और ध्वनि के मिश्रण (Mixing) का निर्माण करते हैं।"
    },

    // Business
    "Digital Marketer": {
      title: "डिजिटल मार्केटर",
      shortDesc: "SEO, सोशल मीडिया और ऑनलाइन विज्ञापनों का उपयोग करके इंटरनेट पर ब्रांडों और उत्पादों को बढ़ावा दें।",
      desc: "डिजिटल मार्केटर इंटरनेट पर लक्षित विज्ञापन अभियान चलाते हैं, वेबसाइटों को रैंक करने में मदद करते हैं और ऑनलाइन ब्रांड का विकास करते हैं।"
    },
    "Product Manager": {
      title: "प्रोडक्ट मैनेजर",
      shortDesc: "डिजिटल उत्पादों के लिए रणनीति, रोडमैप और सुविधाओं की परिभाषा का नेतृत्व करें।",
      desc: "प्रोडक्ट मैनेजर इंजीनियरिंग, डिज़ाइन और व्यावसायिक प्राथमिकताओं को जोड़ते हैं। वे निर्णय लेते हैं कि आगे क्या उत्पाद सुविधाएँ बनाई जाएँगी।"
    },
    "Business Analyst": {
      title: "बिजनेस विश्लेषक",
      shortDesc: "सुधारों और दक्षता की पहचान करने के लिए व्यावसायिक संरचनाओं और प्रक्रियाओं का मूल्यांकन करें।",
      desc: "बिजनेस विश्लेषक व्यावसायिक डेटा का अध्ययन करते हैं, आवश्यकताओं का दस्तावेजीकरण करते हैं और सिस्टम में सुधार की योजना बनाते हैं।"
    },
    "Financial Analyst": {
      title: "वित्तीय विश्लेषक",
      shortDesc: "निवेश विकल्पों का आकलन करें, बजट मॉडल तैयार करें और वित्तीय रुझानों का अनुमान लगाएं।",
      desc: "वित्तीय विश्लेषक शेयर बाजारों का विश्लेषण करते हैं, वित्तीय अनुमान मॉडल बनाते हैं और निवेश सिफारिशें तैयार करते हैं।"
    },
    "Startup Founder / Entrepreneur": {
      title: "स्टार्टअप संस्थापक / उद्यमी",
      shortDesc: "शून्य से एक नया व्यावसायिक उद्यम शुरू करें, विकसित करें और प्रबंधित करें।",
      desc: "उद्यमी व्यावसायिक योजनाएं बनाते हैं, धन (Funding) प्राप्त करते हैं, उत्पाद विकसित करते हैं और नए व्यावसायिक जोखिमों का सामना करते हैं।"
    },
    "HR Specialist": {
      title: "HR विशेषज्ञ",
      shortDesc: "संगठनों के भीतर कर्मचारियों की भर्ती, ऑनबोर्डिंग और संबंधों का प्रबंधन और समन्वय करें।",
      desc: "एचआर विशेषज्ञ नौकरियों के लिए विज्ञापन देते हैं, साक्षात्कार आयोजित करते हैं, प्रशिक्षण प्रदान करते हैं और कार्य नीतियों का प्रबंधन करते हैं।"
    },
    "Sales Executive": {
      title: "बिक्री कार्यकारी",
      shortDesc: "व्यावसायिक विकास के लिए ग्राहकों को सेवाएं पिच करें और बिक्री अनुबंध बंद करें।",
      desc: "बिक्री कार्यकारी ग्राहकों से संपर्क करते हैं, सॉफ्टवेयर का डेमो देते हैं और व्यावसायिक सौदों को अंतिम रूप देते हैं।"
    },
    "Project Manager": {
      title: "प्रोजेक्ट मैनेजर",
      shortDesc: "परियोजना के लक्ष्यों को समय पर वितरित करने के लिए समयसीमा, बजट और टीम गतिविधियों का समन्वय करें।",
      desc: "प्रोजेक्ट मैनेजर परियोजनाओं के समय पर पूरा होने को सुनिश्चित करने के लिए डेवलपर टिकटों, बजट और बैठक समय को ट्रैक करते हैं।"
    },
    "SEO Specialist": {
      title: "SEO विशेषज्ञ",
      shortDesc: "खोज इंजनों में वेबसाइटों की रैंकिंग बढ़ाने और ऑर्गेनिक ट्रैफ़िक बढ़ाने के लिए साइट को अनुकूलित करें।",
      desc: "एसईओ विशेषज्ञ कीवर्ड रिसर्च करते हैं, वेबसाइट टैग को अनुकूलित करते हैं और खोज इंजनों में उच्च रैंकिंग के लिए रणनीतियाँ बनाते हैं।"
    },
    "Content Strategist": {
      title: "सामग्री रणनीतिकार",
      shortDesc: "वेब, ब्लॉग और सोशल मीडिया के लिए रचनात्मक सामग्री कार्यक्रम तैयार और समन्वित करें।",
      desc: "सामग्री रणनीतिकार विभिन्न चैनलों के लिए विषयों का संकलन करते हैं, लेखकों की निगरानी करते हैं और ब्रांड की आवाज सुनिश्चित करते हैं।"
    },
    "Business Data Analyst": {
      title: "बिजनेस डेटा विश्लेषक",
      shortDesc: "व्यावसायिक निर्णयों का समर्थन करने के लिए चार्ट, रिपोर्ट और डैशबोर्ड बनाने के लिए डेटाबेस क्वेरी करें।",
      desc: "व्यावसायिक डेटा विश्लेषक डेटाबेस को क्वेरी करते हैं, रिपोर्टों को साफ करते हैं और निर्णय लेने में अधिकारियों की सहायता करते हैं।"
    },
    "Social Media Manager": {
      title: "सोशल मीडिया मैनेजर",
      shortDesc: "इंस्टाग्राम, टिकटॉक, लिंक्डइन और यूट्यूब के लिए पोस्ट और वीडियो शेड्यूल, प्रबंधित और डिज़ाइन करें।",
      desc: "सोशल मीडिया मैनेजर खातों का प्रबंधन करते हैं, रुझान वाले वीडियो बनाते हैं, टिप्पणियों का जवाब देते हैं और एनालिटिक्स ट्रैक करते हैं।"
    },
    "Public Relations Specialist": {
      title: "पीआर विशेषज्ञ",
      shortDesc: "ब्रांडों के लिए सार्वजनिक घोषणाएं, प्रेस विज्ञप्ति और मीडिया संबंध प्रबंधित करें।",
      desc: "पीआर विशेषज्ञ कंपनियों के लिए सकारात्मक मीडिया छवि बनाने के लिए प्रेस विज्ञप्ति लिखते हैं और संवाददाताओं के साथ काम करते हैं।"
    },

    // Science
    "Biotechnology Researcher": {
      title: "बायोटेक्नोलॉजी शोधकर्ता",
      shortDesc: "स्वास्थ्य सेवा, कृषि और पर्यावरण उत्पादों को विकसित करने के लिए जैविक प्रणालियों का अध्ययन करें।",
      desc: "बायोटेक्नोलॉजी शोधकर्ता प्रयोगशालाओं में काम करते हैं और सेलुलर प्रक्रियाओं का अध्ययन करके नई दवाएं और फसलें विकसित करते हैं।"
    },
    "Data Scientist": {
      title: "डेटा वैज्ञानिक",
      shortDesc: "वैज्ञानिक अनुसंधान को आगे बढ़ाने के लिए जटिल डेटासेट का विश्लेषण और व्याख्या करें।",
      desc: "डेटा वैज्ञानिक जटिल वैज्ञानिक प्रयोगों और मशीन लर्निंग का उपयोग करके वैज्ञानिक समस्याओं का समाधान खोजने में मदद करते हैं।"
    },
    "Bioinformatics Analyst": {
      title: "बायोइंफॉर्मेटिक्स विश्लेषक",
      shortDesc: "बड़े जीनोमिक और जैविक डेटासेट का विश्लेषण करने के लिए कंप्यूटर स्क्रिप्ट का उपयोग करें।",
      desc: "बायोइंफॉर्मेटिक्स विश्लेषक डीएनए अनुक्रमण का अध्ययन करने और आनुवंशिक डेटा को संसाधित करने के लिए पायथन कोड लिखते हैं।"
    },
    "Clinical Trial Coordinator": {
      title: "क्लिनिकल परीक्षण समन्वयक",
      shortDesc: "नई दवाओं और उपकरणों के क्लिनिकल परीक्षणों का प्रबंधन, समन्वय और सुरक्षा की निगरानी करें।",
      desc: "क्लिनिकल समन्वयक परीक्षणों में भाग लेने वाले मरीजों के डेटा को रिकॉर्ड करते हैं और सुनिश्चित करते हैं कि सभी सुरक्षा नियमों का पालन किया जाए।"
    },
    "Pharmacist": {
      title: "फार्मासिस्ट",
      shortDesc: "नुस्खे के अनुसार दवाएं वितरित करें, मरीजों को परामर्श दें और दवा सुरक्षा की जांच करें।",
      desc: "फार्मासिस्ट दवाओं के दुष्प्रभावों के बारे में मरीजों को सलाह देते हैं और नुस्खों के अनुसार खुराक को सत्यापित करते हैं।"
    },
    "Environmental Scientist": {
      title: "पर्यावरण वैज्ञानिक",
      shortDesc: "पारिस्थिकी तंत्र और मानव स्वास्थ्य की रक्षा के लिए मिट्टी, पानी और हवा के नमूनों का विश्लेषण करें।",
      desc: "पर्यावरण वैज्ञानिक प्रदूषण की समस्याओं के समाधान की खोज करते हैं और पर्यावरणीय नीतियों पर सलाह देते हैं।"
    },
    "Research Lab Technician": {
      title: "अनुसंधान लैब तकनीशियन",
      shortDesc: "प्रयोगशाला उपकरणों को स्थापित करें, रासायनिक घोल तैयार करें और प्रयोगों को रिकॉर्ड करें।",
      desc: "लैब तकनीशियन परीक्षणों के लिए नमूने तैयार करते हैं, उपकरणों का रखरखाव करते हैं और वैज्ञानिक प्रयोगों में सहायता करते हैं।"
    },
    "Geneticist": {
      title: "आनुवंशिकीविद् (Geneticist)",
      shortDesc: "जीन, आनुवंशिक लक्षणों, डीएनए विसंगतियों और आनुवंशिक रोगों का अध्ययन करें।",
      desc: "आनुवंशिकीविद् मरीजों के स्वास्थ्य जोखिमों का विश्लेषण करते हैं, डीएनए दृश्यों का अध्ययन करते हैं और आनुवंशिक चिकित्सा विकसित करते हैं।"
    },
    "Astrobiologist": {
      title: "एस्ट्रोबायोलॉजिस्ट",
      shortDesc: "ब्रह्मांड में जैविक जीवन की उत्पत्ति, विकास और संभावनाओं का अध्ययन करें।",
      desc: "एस्ट्रोबायोलॉजिस्ट अंतरिक्ष दूरबीन डेटा का विश्लेषण करते हैं, चरम वातावरणों का अध्ययन करते हैं और अन्य ग्रहों पर जीवन की संभावनाओं का पता लगाते हैं।"
    },
    "Medical Writer": {
      title: "चिकित्सा लेखक",
      shortDesc: "जटिल चिकित्सा अनुसंधान परिणामों को सरल विनिर्देशों या रोगी गाइडों में लिखें।",
      desc: "मेडिकल लेखक चिकित्सा परीक्षणों के परिणामों को लिखते हैं, वैज्ञानिक शोध पत्रों को संपादित करते हैं और दवा सुरक्षा निर्देश तैयार करते हैं।"
    },
    "Forensic Scientist": {
      title: "फोरेंसिक वैज्ञानिक",
      shortDesc: "अपराध स्थल के साक्ष्यों जैसे डीएनए, उंगलियों के निशान और रसायनों का विश्लेषण करें।",
      desc: "फोरेंसिक वैज्ञानिक प्रयोगशाला में साक्ष्यों की जांच करते हैं, रिपोर्ट तैयार करते हैं और कानूनी प्रक्रियाओं में साक्ष्य प्रस्तुत करते हैं।"
    },
    "Marine Biologist": {
      title: "समुद्री जीवविज्ञानी",
      shortDesc: "महासागरों, समुद्री प्रजातियों और समुद्री पारिस्थितिकी प्रणालियों का अध्ययन करें।",
      desc: "समुद्री जीवविज्ञानी समुद्री जीवों के व्यवहार, प्रवाल भित्तियों के संरक्षण और महासागरों पर जलवायु परिवर्तन के प्रभाव का अध्ययन करते हैं।"
    }
  };

  function changeLanguage(lang) {
    state.language = lang;
    localStorage.setItem('pathfinder_lang', lang);
    
    // Update elements with data-translate attribute
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(el => {
      const key = el.getAttribute('data-translate');
      if (translations[lang] && translations[lang][key]) {
        el.textContent = translations[lang][key];
      }
    });

    // Update elements with data-translate-placeholder attribute
    const inputs = document.querySelectorAll('[data-translate-placeholder]');
    inputs.forEach(el => {
      const key = el.getAttribute('data-translate-placeholder');
      if (translations[lang] && translations[lang][key]) {
        el.setAttribute('placeholder', translations[lang][key]);
      }
    });

    // Handle welcome bubble in advisor chat dynamically
    const welcomeBubble = document.getElementById('chat-welcome-bubble');
    if (welcomeBubble) {
      if (lang === 'hi') {
        welcomeBubble.textContent = "👋 नमस्ते! मैं आपका एआई करियर सलाहकार हूं। शुरू करने के लिए करियर, कौशल ट्रैक, वेतन या करियर पथ के बारे में कोई भी प्रश्न पूछें!";
      } else {
        welcomeBubble.textContent = "👋 Hello! I'm your AI Career Advisor. Ask me any questions about careers, skill tracks, salaries, or pathways to get started!";
      }
    }

    // Update language select buttons active state
    const langBtns = document.querySelectorAll('.language-btn');
    langBtns.forEach(btn => {
      if (btn.getAttribute('data-lang') === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Re-render components with translated dynamic data
    if (typeof renderCareers === 'function') renderCareers();
    if (typeof renderSkillsHub === 'function') renderSkillsHub();
    if (typeof setupPortfolio === 'function') setupPortfolio();
    
    const quizQuestionText = document.querySelector('.quiz-question-text');
    if (quizQuestionText && typeof showQuizQuestion === 'function') {
      showQuizQuestion();
    }
  }

  // --- INIT APP ---
  function init() {
    checkAuth();
    setupAuthEvents();
    updateXPBadge();
    setupNavigation();
    setupAssessment();
    setupCareerExplorer();
    setupSkillsHub();
    setupAIAdvisor();
    setupPortfolio();
    setupFeedback();

    // Initialize local/cloud toggles
    const signinLocalToggle = document.getElementById('signin-local-toggle');
    const signupLocalToggle = document.getElementById('signup-local-toggle');
    const isLocal = (state.authMode === 'local');
    if (signinLocalToggle) signinLocalToggle.checked = isLocal;
    if (signupLocalToggle) signupLocalToggle.checked = isLocal;

    const syncToggles = (checked) => {
      const mode = checked ? 'local' : 'firebase';
      state.authMode = mode;
      localStorage.setItem('pathfinder_auth_mode', mode);
      if (signinLocalToggle) signinLocalToggle.checked = checked;
      if (signupLocalToggle) signupLocalToggle.checked = checked;
    };

    if (signinLocalToggle) {
      signinLocalToggle.addEventListener('change', (e) => syncToggles(e.target.checked));
    }
    if (signupLocalToggle) {
      signupLocalToggle.addEventListener('change', (e) => syncToggles(e.target.checked));
    }

    // Set initial language
    changeLanguage(localStorage.getItem('pathfinder_lang') || 'en');

    switchTab('home');
  }

  // --- STATE SAVERS ---
  function saveState() {
    if (activeEmail) {
      const userState = {
        userXP: state.userXP,
        completedModules: state.completedModules,
        bookmarkedCareers: state.bookmarkedCareers
      };
      localStorage.setItem(`pathfinder_state_${activeEmail}`, JSON.stringify(userState));
    }
    updateXPBadge();
    setupPortfolio(); // refresh portfolio items
  }

  function updateXPBadge() {
    if (xpBadge) {
      xpBadge.textContent = `${state.userXP} XP`;
    }
  }

  // --- ROUTER / NAVIGATION ---
  function setupNavigation() {
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.getAttribute('data-tab');
        switchTab(tab);
      });
    });

    if (logo) {
      logo.addEventListener('click', () => {
        switchTab('home');
      });
    }

    // Connect dashboard buttons
    const startQuizBtn = document.getElementById('start-quiz-hero');
    if (startQuizBtn) {
      startQuizBtn.addEventListener('click', () => switchTab('quiz'));
    }

    const startSkillsBtn = document.getElementById('start-skills-hero');
    if (startSkillsBtn) {
      startSkillsBtn.addEventListener('click', () => switchTab('skills'));
    }
  }

  function switchTab(tabId) {
    state.currentTab = tabId;

    navItems.forEach(item => {
      if (item.getAttribute('data-tab') === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    viewPanels.forEach(panel => {
      if (panel.id === `${tabId}-view`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // Refresh pages if needed
    if (tabId === 'portfolio') {
      setupPortfolio();
    } else if (tabId === 'skills') {
      renderSkillsHub();
    } else if (tabId === 'explorer') {
      renderCareers();
    }
  }

  // --- ASSESSMENT QUIZ ---
  function setupAssessment() {
    const startBtn = document.getElementById('start-quiz-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        state.quizCurrentQuestion = 0;
        state.quizAnswers = {};
        showQuizQuestion();
      });
    }
  }

  const quizQuestionsHindi = [
    {
      text: "आपको किस तरह की गतिविधियां सबसे ज्यादा पसंद हैं?",
      options: {
        "tech": "इलेक्ट्रॉनिक्स के साथ खेलना, कोडिंग लिखना, या वेबसाइट बनाना।",
        "creative": "चित्रकारी, पेंटिंग, वीडियो बनाना, या पोस्टर डिजाइन करना।",
        "business": "चीजें बेचना, कार्यक्रमों की योजना बनाना, या पॉकेट-मनी बजट प्रबंधित करना।",
        "science": "विज्ञान प्रयोग करना, पौधों/जानवरों का अध्ययन करना, या तारे देखना।"
      }
    },
    {
      text: "यदि कोई खिलौना या गैजेट टूट जाता है, तो आप उसे कैसे ठीक करते हैं?",
      options: {
        "tech": "मैं वायरिंग, बटन या सॉफ़्टवेयर सेटिंग्स को देखता हूँ।",
        "creative": "मैं इसे पेंट करता हूँ, सजाता हूँ, या इसके दृश्य भागों को फिर से बनाता हूँ।",
        "business": "मैं गणना करता हूँ कि क्या नया खरीदना सस्ता है या पुराने पुर्जे बेचना बेहतर है।",
        "science": "मैं अध्ययन करता हूँ कि आंतरिक रूप से तंत्र कैसे काम करता है ताकि मूल कारण का पता लगाया जा सके।"
      }
    },
    {
      text: "आप एक दिन कहाँ काम करना चाहेंगे?",
      options: {
        "tech": "किसी कंप्यूटर सॉफ़्टवेयर कंपनी में ऐप्स या गेम्स पर काम करना।",
        "creative": "किसी आर्ट स्टूडियो, फिल्म सेट, या डिज़ाइन एजेंसी में।",
        "business": "किसी कार्यालय में टीम का नेतृत्व करना या अपनी खुद की दुकान शुरू करना।",
        "science": "किसी प्रयोगशाला, क्लिनिक, या बाहरी प्रकृति रिजर्व में।"
      }
    },
    {
      text: "स्कूल में आपका पसंदीदा विषय कौन सा है?",
      options: {
        "tech": "कंप्यूटर विज्ञान या प्रोग्रामिंग कक्षाएं।",
        "creative": "कला, संगीत, नाटक, या अंग्रेजी लेखन।",
        "business": "गणित, सार्वजनिक भाषण, या सामाजिक अध्ययन।",
        "science": "जीव विज्ञान, रसायन विज्ञान, भौतिकी, या पृथ्वी विज्ञान।"
      }
    },
    {
      text: "खाली समय में आपको क्या करना पसंद है?",
      options: {
        "tech": "गेम बनाना, रोबोटिक किट के साथ खेलना, या तकनीक को कस्टमाइज़ करना।",
        "creative": "डिजिटल कला बनाना, कहानियां लिखना, या तस्वीरें संपादित करना।",
        "business": "शेयरों के बारे में सीखना, व्यावसायिक विचारों को देखना, या क्लब का आयोजन करना।",
        "science": "विज्ञान की किताबें पढ़ना, अंतरिक्ष तथ्यों की खोज करना, या पालतू जानवरों की देखभाल करना।"
      }
    },
    {
      text: "आप लोगों की मदद कैसे करना चाहते हैं?",
      options: {
        "tech": "उपयोगी ऐप्स और वेबसाइटें बनाकर जो दैनिक समस्याओं का समाधान करती हैं।",
        "creative": "सुंदर डिज़ाइन, एनिमेशन, या किताबें बनाकर जो उन्हें प्रेरित करती हैं।",
        "business": "नए व्यवसाय बनाकर, उत्पाद बेचकर, और रोजगार के अवसर पैदा करके।",
        "science": "बीमारियों के इलाज की खोज करके या पर्यावरण की रक्षा करके।"
      }
    },
    {
      text: "आप ऑनलाइन किस तरह की किताबें या वीडियो देखते हैं?",
      options: {
        "tech": "नए गैजेट्स, कोडिंग ट्यूटोरियल, या भविष्य की तकनीक के बारे में वीडियो।",
        "creative": "ग्राफिक डिज़ाइन युक्तियों, ड्राइंग ट्यूटोरियल, या फिल्म समीक्षाओं के बारे में वीडियो।",
        "business": "प्रसिद्ध स्टार्टअप्स की सफलता की कहानियाँ, मार्केटिंग के तरीके, या पैसा कैसे काम करता है।",
        "science": "अंतरिक्ष, जानवरों, चिकित्सा, या प्रकृति के बारे में वृत्तचित्र।"
      }
    },
    {
      text: "एक समूह परियोजना में, आपका पसंदीदा काम कौन सा है?",
      options: {
        "tech": "स्लाइड्स सेट करना, इंटरैक्टिव डेमो बनाना, या तकनीक संभालना।",
        "creative": "लेआउट डिज़ाइन करना, रंग चुनना, और चित्र चुनना।",
        "business": "नेता बनना, भाषण देना, या समय का ध्यान रखना।",
        "science": "पृष्ठभूमि शोध करना और विवरणों की सत्यता की जांच करना।"
      }
    },
    {
      text: "आपका पसंदीदा उपकरण कौन सा है?",
      options: {
        "tech": "एक कंप्यूटर कीबोर्ड, कोडिंग एडिटर, या इलेक्ट्रॉनिक किट।",
        "creative": "एक ड्राइंग टैबलेट, कैमरा, पेंसिल, या डिज़ाइन सॉफ़्टवेयर।",
        "business": "एक प्लानर, कैलेंडर, नोटपैड, या बजट स्प्रेडशीट।",
        "science": "एक आवर्धक लेंस, कैलकुलेटर, माइक्रोस्कोप, या टेस्ट ट्यूब।"
      }
    },
    {
      text: "आप किसी नए खेल को सबसे अच्छी तरह कैसे सीखते हैं?",
      options: {
        "tech": "नियमों को देखकर और चरण-दर-चरण प्रयोग करके।",
        "creative": "दृश्य डिज़ाइन, पात्रों और कहानी को देखकर।",
        "business": "अन्य खिलाड़ियों के खिलाफ जीतने की रणनीति बनाकर।",
        "science": "आंकड़ों का विश्लेषण करके और सीखकर कि कौन सी चालें गणितीय रूप से सर्वोत्तम हैं।"
      }
    },
    {
      text: "आपके लिए सबसे कष्टप्रद बात क्या है?",
      options: {
        "tech": "ऐसी वेबसाइट जिसमें बग हों, लैग हो, या ठीक से काम न करे।",
        "creative": "उबाऊ, सादे डिज़ाइन जिनमें बदसूरत फोंट और रंग हों।",
        "business": "खराब योजना के कारण समय या पैसा बर्बाद करना।",
        "science": "बिना किसी वास्तविक वैज्ञानिक प्रमाण के लोगों द्वारा नकली तथ्य साझा करना।"
      }
    },
    {
      text: "किस प्रकार की फिल्म या शो आपका पसंदीदा है?",
      options: {
        "tech": "विज्ञान-कथा (Sci-fi) फिल्में, हैकर फिल्में, या तकनीकी इतिहास के वृत्तचित्र।",
        "creative": "एनिमेटेड फिल्में, कार्टून, या डिज़ाइन शो।",
        "business": "विचारों को पिच करने वाले उद्यमियों के शो या नेताओं की जीवनियाँ।",
        "science": "डायनासोर, चिकित्सा, जंगली जानवरों, या भौतिकी के रहस्यों के बारे में शो।"
      }
    }
  ];

  function showQuizQuestion() {
    const quizArea = document.getElementById('quiz-dynamic-area');
    const qCount = appData.quizQuestions.length;

    if (state.quizCurrentQuestion >= qCount) {
      showQuizResults();
      return;
    }

    const isHindi = (state.language === 'hi');
    const question = appData.quizQuestions[state.quizCurrentQuestion];
    const qText = isHindi ? quizQuestionsHindi[state.quizCurrentQuestion].text : question.text;
    const progressPercent = Math.round((state.quizCurrentQuestion / qCount) * 100);

    let optionsHtml = '';
    question.options.forEach((opt, idx) => {
      const optText = isHindi ? quizQuestionsHindi[state.quizCurrentQuestion].options[opt.category] : opt.text;
      optionsHtml += `
        <button class="quiz-option-btn" data-category="${opt.category}">
          ${optText}
        </button>
      `;
    });

    const labelQuestionNumber = isHindi 
      ? `प्रश्न ${state.quizCurrentQuestion + 1} का ${qCount}` 
      : `Question ${state.quizCurrentQuestion + 1} of ${qCount}`;

    quizArea.innerHTML = `
      <div class="progress-bar-container">
        <div class="progress-bar-fill" style="width: ${progressPercent}%"></div>
      </div>
      <div class="quiz-question-number">${labelQuestionNumber}</div>
      <h3 class="quiz-question-text">${qText}</h3>
      <div class="quiz-options">
        ${optionsHtml}
      </div>
    `;

    // Add option listeners
    const optionBtns = quizArea.querySelectorAll('.quiz-option-btn');
    optionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category');
        state.quizAnswers[cat] = (state.quizAnswers[cat] || 0) + 1;
        state.quizCurrentQuestion++;
        showQuizQuestion();
      });
    });
  }

  function showQuizResults() {
    const quizArea = document.getElementById('quiz-dynamic-area');

    // Calculate top category
    let maxCount = 0;
    let matchCat = 'tech'; // default fallback
    for (const [cat, count] of Object.entries(state.quizAnswers)) {
      if (count > maxCount) {
        maxCount = count;
        matchCat = cat;
      }
    }

    // Filter recommended careers for this category
    const matchedCareers = appData.careers.filter(c => c.category === matchCat).slice(0, 3);

    // Choose recommended skill based on category
    let recSkillId = 'python-beginners';
    if (matchCat === 'creative') {
      recSkillId = 'python-english';
    } else if (matchCat === 'tech') {
      recSkillId = 'java-beginners';
    }
    const recommendedSkill = appData.skills.find(s => s.id === recSkillId) || appData.skills[0];

    // Add completion XP if they haven't gotten it
    let xpEarned = 0;
    if (state.userXP === 0) {
      state.userXP += 100;
      xpEarned = 100;
      saveState();
    }

    const isHindi = (state.language === 'hi');
    const categoryTranslations = {
      tech: isHindi ? "प्रौद्योगिकी (Tech)" : "TECH",
      creative: isHindi ? "क्रिएटिव" : "CREATIVE",
      business: isHindi ? "व्यवसाय" : "BUSINESS",
      science: isHindi ? "विज्ञान" : "SCIENCE"
    };

    const exploreText = isHindi ? "पथ देखें →" : "Explore Path →";
    const resultsTitle = isHindi ? "आकलन पूर्ण!" : "Assessment Complete!";
    
    let matchCatName = categoryTranslations[matchCat] || matchCat.toUpperCase();
    const resultsDesc = isHindi 
      ? `आपकी पसंद के आधार पर, आपका मजबूत रुझान <strong>${matchCatName}</strong> पथ की ओर है।` 
      : `Based on your choices, you have strong alignment with the <strong>${matchCat.toUpperCase()}</strong> path.`;

    const recCareersLabel = isHindi ? "अनुशंसित करियर जिन पर आप आगे बढ़ सकते हैं:" : "Recommended Careers to Follow:";
    const recSkillLabel = isHindi ? "🎯 सीखने के लिए अनुशंसित पहला कौशल:" : "🎯 Recommended Skill to Learn First:";
    const recSkillDesc = isHindi 
      ? `${matchCatName} करियर के लिए कोडिंग एक आवश्यक महाशक्ति है। अपने पोर्टफोलियो को बेहतर बनाने के लिए अभी यह रोडमैप शुरू करें!` 
      : `Coding is an essential superpower for a ${matchCat} career. Start this roadmap now to level up your portfolio!`;

    const startSkillBtn = isHindi ? "कौशल सीखने का रोडमैप शुरू करें" : "Start Skill Learning Roadmap";
    const restartBtnText = isHindi ? "आकलन पुनः लें" : "Retake Assessment";
    const xpLabel = isHindi ? `🎉 पूरा करने के लिए +${xpEarned} XP दिए गए!` : `🎉 +${xpEarned} XP awarded for completion!`;

    let timeText = recommendedSkill.time;
    if (isHindi) {
      timeText = timeText.replace("Lessons", "पाठ").replace("Lectures", "व्याख्यान").replace("hours total", "कुल घंटे");
    }

    // Generate matched careers HTML
    let careersHtml = '';
    matchedCareers.forEach(c => {
      const displayTitle = (isHindi && careerTranslations[c.title]) ? careerTranslations[c.title].title : c.title;
      const displayShortDesc = (isHindi && careerTranslations[c.title]) ? careerTranslations[c.title].shortDesc : c.shortDesc;

      careersHtml += `
        <div class="matched-career-box" style="margin-bottom: 0.75rem; text-align: left; padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: rgba(255,255,255,0.02); display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
          <div style="flex: 1; min-width: 0;">
            <h5 style="margin: 0 0 0.25rem 0; font-size: 0.95rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${displayTitle}</h5>
            <p style="margin: 0; font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${displayShortDesc}</p>
          </div>
          <button class="btn btn-secondary view-path-btn" data-id="${c.id}" style="padding: 0.35rem 0.7rem; font-size: 0.75rem; white-space: nowrap;">${exploreText}</button>
        </div>
      `;
    });

    const displaySkillTitle = (isHindi && skillTranslations[recommendedSkill.title]) ? skillTranslations[recommendedSkill.title] : recommendedSkill.title;

    quizArea.innerHTML = `
      <div class="results-card" style="text-align: center;">
        <div class="results-icon" style="margin-bottom: 0.5rem;">🏆</div>
        <h2 class="gradient-text" style="font-size: 2rem; margin-bottom: 0.25rem;">${resultsTitle}</h2>
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem; font-size: 0.9rem;">${resultsDesc}</p>
        
        <div style="display: flex; flex-direction: column; gap: 1.5rem; text-align: left; margin-bottom: 1.5rem;">
          
          <!-- Career Recommendations Column -->
          <div style="flex: 1;">
            <h4 style="font-size: 0.95rem; color: var(--color-primary); margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">${recCareersLabel}</h4>
            ${careersHtml}
          </div>
          
          <!-- Skill Recommendation Column -->
          <div class="matched-career-box" style="padding: 1.25rem; border: 1px dashed var(--color-secondary); border-radius: 12px; background: rgba(255, 255, 255, 0.02); flex: 1;">
            <h4 style="font-size: 0.95rem; color: var(--color-secondary); margin-top: 0; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">${recSkillLabel}</h4>
            <div style="display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1rem;">
              <span style="font-size: 2.2rem; line-height: 1;">${recommendedSkill.image}</span>
              <div>
                <h5 style="margin: 0 0 0.15rem 0; font-size: 1rem; font-weight: 700; color: #fff;">${displaySkillTitle}</h5>
                <p style="margin: 0; font-size: 0.75rem; color: var(--text-secondary);">${timeText}</p>
                <p style="margin: 0.4rem 0 0 0; font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4;">${recSkillDesc}</p>
              </div>
            </div>
            <button class="btn btn-primary start-rec-skill-btn" data-id="${recommendedSkill.id}" style="width: 100%; padding: 0.55rem; font-size: 0.85rem;">${startSkillBtn}</button>
          </div>
          
        </div>

        ${xpEarned > 0 ? `<p style="color: var(--color-success); font-weight: 600; margin-bottom: 1.25rem; font-size: 0.9rem;">${xpLabel}</p>` : ''}

        <div style="display: flex; justify-content: center; gap: 1rem;">
          <button class="btn btn-secondary" id="restart-quiz-btn" style="padding: 0.5rem 1.25rem; font-size: 0.85rem;">${restartBtnText}</button>
        </div>
      </div>
    `;

    // Bind event listeners for career view buttons
    quizArea.querySelectorAll('.view-path-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const career = appData.careers.find(c => c.id === id);
        if (career) openCareerModal(career);
      });
    });

    // Bind event listener for recommended skill button
    quizArea.querySelector('.start-rec-skill-btn').addEventListener('click', (e) => {
      const skillId = e.target.getAttribute('data-id');
      switchTab('skills');
      openSkillRoadmapModal(skillId);
    });

    document.getElementById('restart-quiz-btn').addEventListener('click', () => {
      state.quizCurrentQuestion = 0;
      state.quizAnswers = {};
      showQuizQuestion();
    });
  }

  // --- CAREER EXPLORER ---
  let careerSearchQuery = '';
  let careerCategoryFilter = 'all';

  function setupCareerExplorer() {
    const searchInput = document.getElementById('career-search');
    const categorySelect = document.getElementById('career-filter');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        careerSearchQuery = e.target.value.toLowerCase();
        renderCareers();
      });
    }

    if (categorySelect) {
      categorySelect.addEventListener('change', (e) => {
        careerCategoryFilter = e.target.value;
        renderCareers();
      });
    }

    renderCareers();
  }

  function renderCareers() {
    const grid = document.getElementById('careers-grid-container');
    if (!grid) return;

    let filtered = appData.careers.filter(career => {
      const matchesSearch = career.title.toLowerCase().includes(careerSearchQuery) ||
        career.shortDesc.toLowerCase().includes(careerSearchQuery);
      const matchesCategory = careerCategoryFilter === 'all' || career.category === careerCategoryFilter;
      return matchesSearch && matchesCategory;
    });

    const isHindi = (state.language === 'hi');

    if (filtered.length === 0) {
      const noMatchMsg = isHindi ? "कोई भी करियर आपके खोज मापदंड से मेल नहीं खाता है।" : "No careers match your search criteria.";
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 3rem;">${noMatchMsg}</div>`;
      return;
    }

    const labelSalary = isHindi ? "अनुमानित वेतन" : "Est. Salary";
    const labelGrowth = isHindi ? "नौकरी में विकास" : "Job Growth";
    const labelViewPath = isHindi ? "पथ देखें →" : "View Path →";
    const categoryTranslations = {
      tech: isHindi ? "प्रौद्योगिकी (Tech)" : "tech",
      creative: isHindi ? "क्रिएटिव" : "creative",
      business: isHindi ? "व्यवसाय" : "business",
      science: isHindi ? "विज्ञान" : "science"
    };

    let cardsHtml = '';
    filtered.forEach(career => {
      const isBookmarked = state.bookmarkedCareers.includes(career.id);
      let bookmarkIconHtml = isBookmarked ? '★ Bookmarked' : '☆ Bookmark';
      if (isHindi) {
        bookmarkIconHtml = isBookmarked ? '★ बुकमार्क' : '☆ बुकमार्क';
      }

      const displayTitle = (isHindi && careerTranslations[career.title]) ? careerTranslations[career.title].title : career.title;
      const displayShortDesc = (isHindi && careerTranslations[career.title]) ? careerTranslations[career.title].shortDesc : career.shortDesc;

      cardsHtml += `
        <div class="glass-card career-card" data-id="${career.id}">
          <span class="career-tag">${categoryTranslations[career.category] || career.category}</span>
          <h3>${displayTitle}</h3>
          <p>${displayShortDesc}</p>
          <div class="career-meta">
            <div>
              <span class="meta-label">${labelSalary}</span>
              <span class="meta-value">${career.salary}</span>
            </div>
            <div>
              <span class="meta-label">${labelGrowth}</span>
              <span class="meta-value" style="color: var(--color-success)">${career.growth.split(' ')[0]}</span>
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-secondary bookmark-btn" style="flex: 1; font-size: 0.85rem;" data-id="${career.id}">${bookmarkIconHtml}</button>
            <button class="btn btn-primary explore-details-btn" style="flex: 1.2; font-size: 0.85rem;" data-id="${career.id}">${labelViewPath}</button>
          </div>
        </div>
      `;
    });

    grid.innerHTML = cardsHtml;

    // Attach button events
    grid.querySelectorAll('.explore-details-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const career = appData.careers.find(c => c.id === id);
        if (career) openCareerModal(career);
      });
    });

    grid.querySelectorAll('.bookmark-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        toggleBookmark(id);
        renderCareers();
      });
    });
  }

  function toggleBookmark(careerId) {
    const idx = state.bookmarkedCareers.indexOf(careerId);
    if (idx > -1) {
      state.bookmarkedCareers.splice(idx, 1);
    } else {
      state.bookmarkedCareers.push(careerId);
      state.userXP += 15; // award XP for saving a career
    }
    saveState();
  }

  function openCareerModal(career) {
    const isBookmarked = state.bookmarkedCareers.includes(career.id);
    const isHindi = (state.language === 'hi');

    // Mapped generic pathways in Hindi
    const pathTranslations = {
      "Start early by learning foundational concepts and scripting tools.": 
        "बुनियादी अवधारणाओं और स्क्रिप्टिंग टूल को सीखकर जल्दी शुरुआत करें।",
      "Work on personal projects and build a professional portfolio/GitHub archive.": 
        "व्यक्तिगत परियोजनाओं पर काम करें और एक पेशेवर पोर्टफोलियो/गिटहब संग्रह बनाएं।",
      "Seek mentorship, look for research/creative internships, and grow your network.": 
        "मेंटरशिप लें, अनुसंधान/रचनात्मक इंटर्नशिप की तलाश करें, और अपने नेटवर्क का विस्तार करें।",
      "Apply for junior/associate level roles to gain early industry experience.": 
        "शुरुआती उद्योग अनुभव प्राप्त करने के लिए जूनियर/एसोसिएट स्तर की भूमिकाओं के लिए आवेदन करें।"
    };

    let skillListHtml = '';
    career.skillsRequired.forEach(sk => {
      skillListHtml += `<li>${sk}</li>`;
    });

    let pathwayListHtml = '';
    career.pathway.forEach(p => {
      const displayPathStep = isHindi ? (pathTranslations[p] || p) : p;
      pathwayListHtml += `<li>${displayPathStep}</li>`;
    });

    let resourcesHtml = '';
    career.resources.forEach(r => {
      resourcesHtml += `<a href="${r.url}" target="_blank" rel="noopener" class="resource-link">${r.title} ↗</a>`;
    });

    const categoryTranslations = {
      tech: isHindi ? "प्रौद्योगिकी (Tech)" : "TECH",
      creative: isHindi ? "क्रिएटिव" : "CREATIVE",
      business: isHindi ? "बिजनेस" : "BUSINESS",
      science: isHindi ? "विज्ञान" : "SCIENCE"
    };

    const displayTitle = (isHindi && careerTranslations[career.title]) ? careerTranslations[career.title].title : career.title;
    const displayDesc = (isHindi && careerTranslations[career.title]) ? careerTranslations[career.title].desc : career.desc;

    let displayDifficulty = career.difficulty;
    let displayGrowth = career.growth;
    if (isHindi) {
      displayDifficulty = displayDifficulty
        .replace("Medium-Hard", "मध्यम-कठिन")
        .replace("Medium", "मध्यम")
        .replace("Hard", "कठिन")
        .replace("Easy-Medium", "आसान-मध्यम")
        .replace("Easy", "आसान");
      
      displayGrowth = displayGrowth
        .replace("Exponential", "घातांकीय")
        .replace("Very High", "बहुत अधिक")
        .replace("High", "अधिक")
        .replace("Medium-High", "मध्यम-अधिक")
        .replace("Medium", "मध्यम")
        .replace("Low", "कम")
        .replace("growth", "विकास");
    }

    const pathText = isHindi ? `${categoryTranslations[career.category]} पथ` : `${career.category.toUpperCase()} PATHWAY`;
    const labelOverview = isHindi ? "करियर का विवरण" : "Career Overview";
    const labelMetrics = isHindi ? "महत्वपूर्ण मेट्रिक्स" : "Key Metrics";
    const labelSalary = isHindi ? "औसत वेतन:" : "Average Salary:";
    const labelOutlook = isHindi ? "रोजगार आउटलुक:" : "Employment Outlook:";
    const labelDifficulty = isHindi ? "कठिनाई स्तर:" : "Path Difficulty:";
    const labelSkills = isHindi ? "आवश्यक मुख्य कौशल" : "Key Skills Required";
    const labelPath = isHindi ? "अनुशंसित करियर पथ" : "Recommended Career Path";
    const labelResources = isHindi ? "बाहरी अध्ययन संसाधन" : "External Study Resources";
    
    let bookmarkText = isBookmarked ? '★ Bookmarked' : '☆ Bookmark';
    if (isHindi) {
      bookmarkText = isBookmarked ? '★ बुकमार्क' : '☆ बुकमार्क';
    }

    modalBody.innerHTML = `
      <h2 class="modal-title">${displayTitle}</h2>
      <div class="modal-subtitle" style="display: flex; justify-content: space-between; align-items: center;">
        <span>${pathText}</span>
        <button class="btn btn-secondary" id="modal-bookmark-toggle" data-id="${career.id}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">
          ${bookmarkText}
        </button>
      </div>

      <div class="detail-section">
        <h5>${labelOverview}</h5>
        <p>${displayDesc}</p>
      </div>

      <div class="detail-section">
        <h5>${labelMetrics}</h5>
        <p><strong>${labelSalary}</strong> ${career.salary}</p>
        <p><strong>${labelOutlook}</strong> ${displayGrowth}</p>
        <p><strong>${labelDifficulty}</strong> ${displayDifficulty}</p>
      </div>

      <div class="detail-section">
        <h5>${labelSkills}</h5>
        <ul class="detail-list">
          ${skillListHtml}
        </ul>
      </div>

      <div class="detail-section">
        <h5>${labelPath}</h5>
        <ul class="detail-list" style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${pathwayListHtml}
        </ul>
      </div>

      <div class="detail-section">
        <h5>${labelResources}</h5>
        <div class="resources-list">
          ${resourcesHtml}
        </div>
      </div>
    `;

    document.getElementById('modal-bookmark-toggle').addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      toggleBookmark(id);
      const currentlySaved = state.bookmarkedCareers.includes(id);
      if (isHindi) {
        e.target.textContent = currentlySaved ? '★ बुकमार्क' : '☆ बुकमार्क';
      } else {
        e.target.textContent = currentlySaved ? '★ Bookmarked' : '☆ Bookmark';
      }
    });

    openModal();
  }

  // --- SKILLS HUB ---
  function setupSkillsHub() {
    renderSkillsHub();
  }

  function renderSkillsHub() {
    const container = document.getElementById('skills-grid-container');
    if (!container) return;

    const isHindi = (state.language === 'hi');
    const labelProgress = isHindi ? "प्रगति" : "Progress";

    let skillsHtml = '';
    appData.skills.forEach(skill => {
      // Calculate progress
      const totalModules = skill.modules.length;
      const completedCount = skill.modules.filter(m => state.completedModules.includes(m.id)).length;
      const progressPercent = Math.round((completedCount / totalModules) * 100);

      let timeText = skill.time;
      if (isHindi) {
        timeText = timeText.replace("Lessons", "पाठ").replace("Lectures", "व्याख्यान").replace("hours total", "कुल घंटे");
      }

      let btnText = progressPercent === 100 ? 'Review Roadmap' : (progressPercent > 0 ? 'Continue Roadmap' : 'Start Learning →');
      if (isHindi) {
        btnText = progressPercent === 100 ? 'रोडमैप की समीक्षा करें' : (progressPercent > 0 ? 'रोडमैप जारी रखें' : 'सीखना शुरू करें →');
      }

      const displayTitle = (isHindi && skillTranslations[skill.title]) ? skillTranslations[skill.title] : skill.title;

      skillsHtml += `
        <div class="glass-card skill-card">
          <div class="skill-card-header">
            <span class="skill-icon">${skill.image}</span>
            <span class="skill-time">${timeText}</span>
          </div>
          <h3>${displayTitle}</h3>
          
          <div class="skill-progress-wrapper">
            <div class="skill-progress-text">
              <span>${labelProgress}</span>
              <span>${progressPercent}%</span>
            </div>
            <div class="skill-progress-bar">
              <div class="skill-progress-fill" style="width: ${progressPercent}%; background: var(--color-secondary)"></div>
            </div>
          </div>

          <button class="btn btn-primary start-skill-btn" style="width: 100%;" data-id="${skill.id}">
            ${btnText}
          </button>
        </div>
      `;
    });

    container.innerHTML = skillsHtml;

    container.querySelectorAll('.start-skill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openSkillRoadmapModal(id);
      });
    });
  }

  function openSkillRoadmapModal(skillId) {
    try {
      console.log('Opening roadmap modal for skill:', skillId);
      const skill = appData.skills.find(s => s.id === skillId);
      if (!skill) {
        console.error('Skill not found:', skillId);
        return;
      }

      state.activeSkillId = skillId;
      const isHindi = (state.language === 'hi');

      const displayTitle = (isHindi && skillTranslations[skill.title]) ? skillTranslations[skill.title] : skill.title;
      const displaySubtitle = isHindi 
        ? "अपनी प्रगति को ट्रैक करें। प्रत्येक पूर्ण मॉड्यूल के लिए +20 XP दिए जाएंगे।" 
        : "Track your milestones. Each checked module grants +20 XP.";
      const closeBtnText = isHindi ? "रोडमैप बंद करें" : "Close Roadmap";
      const watchText = isHindi ? "🎥 देखें" : "🎥 Watch";
      const closeText = isHindi ? "✕ बंद करें" : "✕ Close";

      let modulesHtml = '';
      skill.modules.forEach(mod => {
        const isCompleted = state.completedModules.includes(mod.id);
        
        let displayModTitle = mod.title;
        if (isHindi) {
          displayModTitle = displayModTitle.replace(/Day (\d+)/g, "दिन $1");
          displayModTitle = displayModTitle.replace(/Lesson (\d+)/g, "पाठ $1");
          displayModTitle = displayModTitle.replace(/Lec-(\d+)/g, "लेक्चर $1");
          displayModTitle = displayModTitle.replace(/Lec (\d+)/g, "लेक्चर $1");
          displayModTitle = displayModTitle.replace(/Lecture (\d+)/g, "लेक्चर $1");
          displayModTitle = displayModTitle.replace(/Video (\d+)/g, "वीडियो $1");
          displayModTitle = displayModTitle.replace(/Chapter (\d+)/g, "अध्याय $1");
        }

        modulesHtml += `
          <div class="module-item" style="flex-direction: column; align-items: stretch; gap: 0.75rem;">
            <div style="display: flex; gap: 1rem; align-items: flex-start; width: 100%;">
              <input type="checkbox" class="module-checkbox" data-id="${mod.id}" ${isCompleted ? 'checked' : ''}>
              <div class="module-info" style="flex: 1;">
                <h5>${displayModTitle}</h5>
                <p>${mod.desc}</p>
              </div>
              ${mod.playlistIndex !== undefined || mod.videoId ? `<button class="btn btn-secondary toggle-video-btn" style="padding: 0.35rem 0.7rem; font-size: 0.75rem; min-width: 90px;" data-video-id="${mod.videoId || ''}" data-start="${mod.start || 0}" data-playlist-index="${mod.playlistIndex !== undefined ? mod.playlistIndex : ''}">${watchText}</button>` : ''}
            </div>
            ${mod.playlistIndex !== undefined || mod.videoId ? `
              <div class="video-container" style="display: none; border-radius: 8px; overflow: hidden; position: relative; padding-top: 56.25%; height: 0; background: #000; border: 1px solid var(--border-color);">
                <iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" src="" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
              </div>
            ` : ''}
          </div>
        `;
      });

      modalBody.innerHTML = `
        <h2 class="modal-title">${displayTitle}</h2>
        <div class="modal-subtitle">${displaySubtitle}</div>

        <div class="module-list" style="margin-bottom: 2rem;">
          ${modulesHtml}
        </div>

        <button class="btn btn-primary" id="close-modal-btn" style="width: 100%">${closeBtnText}</button>
      `;

      // Add video toggle listeners
      const toggleVideoBtns = modalBody.querySelectorAll('.toggle-video-btn');
      toggleVideoBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const videoId = btn.getAttribute('data-video-id');
          const startTime = btn.getAttribute('data-start') || '0';
          const playlistIndex = btn.getAttribute('data-playlist-index');
          const moduleItem = btn.closest('.module-item');
          const videoContainer = moduleItem.querySelector('.video-container');
          const iframe = videoContainer.querySelector('iframe');

          if (videoContainer.style.display === 'none') {
            // Close other open videos first
            modalBody.querySelectorAll('.video-container').forEach(container => {
              container.style.display = 'none';
              container.querySelector('iframe').src = '';
            });
            modalBody.querySelectorAll('.toggle-video-btn').forEach(otherBtn => {
              otherBtn.innerHTML = watchText;
            });

            // Open selected video
            videoContainer.style.display = 'block';
            if (state.activeSkillId === 'python-beginners') {
              iframe.src = `https://www.youtube.com/embed/${videoId}?list=PLu0W_9lII9agwh1XjRt242xIpHhPT2llg&autoplay=1`;
            } else if (state.activeSkillId === 'java-beginners') {
              iframe.src = `https://www.youtube.com/embed/${videoId}?list=PLQEaRBV9gAFsR15tNo2QLF9d2qc-c018p&autoplay=1`;
            } else if (state.activeSkillId === 'python-english') {
              iframe.src = `https://www.youtube.com/embed/${videoId}?list=PLsyeobzWxl7omDoEYrrf3oXvXxa6MPgek&autoplay=1`;
            } else if (state.activeSkillId === 'cpp-beginners') {
              iframe.src = `https://www.youtube.com/embed/${videoId}?list=PLxCzCOWd7aiF6yRNI5OHQsnUJQfl7Geqj&autoplay=1`;
            } else if (state.activeSkillId === 'arduino-beginners') {
              iframe.src = `https://www.youtube.com/embed/${videoId}?list=PLwWF-ICTWmB7-b9bsE3UcQzz-7ipI5tbR&autoplay=1`;
            } else if (state.activeSkillId === 'javascript-beginners') {
              iframe.src = `https://www.youtube.com/embed/${videoId}?list=PLGjplNEQ1it_oTvuLRNqXfz_v_0pq6unW&autoplay=1`;
            } else if (state.activeSkillId === 'web-dev-apna') {
              iframe.src = `https://www.youtube.com/embed/${videoId}?list=PLfqMhTWNBTe0PY9xunOzsP5kmYIz2Hu7i&autoplay=1`;
            } else if (state.activeSkillId === 'web-dev-delta') {
              iframe.src = `https://www.youtube.com/embed/${videoId}?list=PLfqMhTWNBTe3H6c9OGXb5_6wcc1Mca52n&autoplay=1`;
            } else if (state.activeSkillId === 'react-beginners') {
              iframe.src = `https://www.youtube.com/embed/${videoId}?list=PLu0W_9lII9agx66oZnT6IyhcMIbUMNMdt&autoplay=1`;
            } else if (state.activeSkillId === 'dbms-gate') {
              iframe.src = `https://www.youtube.com/embed/${videoId}?list=PLxCzCOWd7aiFAN6I8CuViBuCdJgiOkT2Y&autoplay=1`;
            } else if (state.activeSkillId === 'dsa-gate') {
              iframe.src = `https://www.youtube.com/embed/${videoId}?list=PLxCzCOWd7aiEwaANNt3OqJPVIxwp2ebiT&autoplay=1`;
            } else if (state.activeSkillId === 'ml-beginners') {
              iframe.src = `https://www.youtube.com/embed/${videoId}?list=PLeo1K3hjS3uvCeTYTeyfe0-rN5r8zn9rw&autoplay=1`;
            } else {
              iframe.src = `https://www.youtube.com/embed/${videoId}?start=${startTime}&autoplay=1`;
            }
            btn.innerHTML = closeText;
          } else {
            videoContainer.style.display = 'none';
            iframe.src = '';
            btn.innerHTML = watchText;
          }
        });
      });

      // Add checkbox toggle listeners
      const checkboxes = modalBody.querySelectorAll('.module-checkbox');
      checkboxes.forEach(box => {
        box.addEventListener('change', (e) => {
          try {
            const modId = e.target.getAttribute('data-id');
            if (e.target.checked) {
              if (!state.completedModules.includes(modId)) {
                state.completedModules.push(modId);
                state.userXP += 20;
              }
            } else {
              const index = state.completedModules.indexOf(modId);
              if (index > -1) {
                state.completedModules.splice(index, 1);
                state.userXP = Math.max(0, state.userXP - 20);
              }
            }
            saveState();
            renderSkillsHub();
          } catch (checkboxErr) {
            console.error('Error in checkbox change listener:', checkboxErr);
            alert('Error updating milestone: ' + checkboxErr.message);
          }
        });
      });

      document.getElementById('close-modal-btn').addEventListener('click', closeModal);
      openModal();
    } catch (err) {
      console.error('Error in openSkillRoadmapModal:', err);
      alert('Error opening roadmap: ' + err.message);
    }
  }

  // --- SIMULATED AI ADVISOR ---
  function setupAIAdvisor() {
    const chatInput = document.getElementById('chat-input');
    const chatSubmit = document.getElementById('chat-send-btn');
    const chatMessages = document.getElementById('chat-messages');

    if (!chatSubmit || !chatInput || !chatMessages) return;

    // Send on click
    chatSubmit.addEventListener('click', handleChatSubmit);
    // Send on Enter
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleChatSubmit();
    });

    // Suggested prompt shortcuts
    document.querySelectorAll('.suggested-prompt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.innerText.replace(/"/g, '');
        chatInput.value = text;
        handleChatSubmit();
      });
    });
  }

  function handleChatSubmit() {
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    if (!chatInput || !chatMessages) return;

    const userText = chatInput.value.trim();
    if (!userText) return;

    // Append user bubble
    appendChatBubble(userText, 'user');
    chatInput.value = '';

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Simulate thinking and reply
    setTimeout(() => {
      const response = getBotResponse(userText);
      appendChatBubble(response, 'bot');
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 600);
  }

  function appendChatBubble(text, sender) {
    const chatMessages = document.getElementById('chat-messages');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    bubble.innerText = text;
    chatMessages.appendChild(bubble);
  }

  function getBotResponse(input) {
    const normalizedInput = input.toLowerCase();
    const isHindi = (state.language === 'hi');

    if (isHindi) {
      if (normalizedInput.includes("python") || normalizedInput.includes("पायथन")) {
        return "पायथन शुरुआती लोगों के लिए एक बेहतरीन भाषा है। हम डेटा साइंस के लिए पायथन (23 पाठ) और शुरुआती लोगों के लिए पायथन (14 पाठ) दोनों की पेशकश करते हैं!";
      }
      if (normalizedInput.includes("java") || normalizedInput.includes("जावा")) {
        return "जावा फुल कोर्स 2026 एक उत्कृष्ट 57-पाठों का कोर्स है जो कोर जावा, लूप, एरे, OOPs अवधारणाओं और अपवाद हैंडलिंग को कवर करता है!";
      }
      if (normalizedInput.includes("c++") || normalizedInput.includes("cpp") || normalizedInput.includes("सी++")) {
        return "गेट स्मैशर्स का C++ प्रोग्रामिंग कोर्स 61 पाठों की एक श्रृंखला है जिसमें बुनियादी संरचना, क्लास, कंस्ट्रक्टर और ऑपरेटर ओवरलोडिंग शामिल हैं!";
      }
      if (normalizedInput.includes("arduino") || normalizedInput.includes("अरुडिनो")) {
        return "हमारा शुरुआती लोगों के लिए अरुडिनो कोर्स माइक्रोकंट्रोलर्स, एलईडी सर्किट और सेंसर प्रोग्रामिंग का 7 पाठों का एक उत्कृष्ट परिचय है!";
      }
      if (normalizedInput.includes("javascript") || normalizedInput.includes("js") || normalizedInput.includes("जावास्क्रिप्ट")) {
        return "अपना कॉलेज का जावास्क्रिप्ट फुल कोर्स 14 पाठों का ट्यूटोरियल है जिसमें जावास्क्रिप्ट वेरिएबल्स, लूप्स, फंक्शन्स, डॉम (DOM) और मिनी-प्रोजेक्ट शामिल हैं!";
      }
      if (normalizedInput.includes("react") || normalizedInput.includes("रिएक्ट")) {
        return "कोडविथहैरी का रिएक्ट जेएस मास्टरी कोर्स 78 पाठों का ट्यूटोरियल है जिसमें रिएक्ट कंपोनेंट, प्रॉप्स, स्टेट, हुक्स (useState, useEffect) और कस्टम राउटिंग शामिल है!";
      }
      if (normalizedInput.includes("dbms") || normalizedInput.includes("sql") || normalizedInput.includes("डेटाबेस")) {
        return "गेट स्मैशर्स का DBMS और SQL कोर्स 100 व्याख्यानों की एक पूरी श्रृंखला है जो ER डायग्राम, सामान्यीकरण, SQL क्वेरी और ACID प्रॉपर्टीज को कवर करती है!";
      }
      if (normalizedInput.includes("dsa") || normalizedInput.includes("डेटा स्ट्रक्चर")) {
        return "गेट स्मैशर्स का डेटा स्ट्रक्चर्स एंड एल्गोरिथम्स (DSA) कोर्स जटिलता विश्लेषण, एरे, स्टैक, क्यू, लिंकड लिस्ट, बाइनरी ट्री और सॉर्टिंग एल्गोरिदम को कवर करता है!";
      }
      if (normalizedInput.includes("machine learning") || normalizedInput.includes("ml") || normalizedInput.includes("मशीन लर्निंग") || normalizedInput.includes("ai") || normalizedInput.includes("एआई")) {
        return "कोडबेसिक्स का पायथन के साथ मशीन लर्निंग कोर्स 42 पाठों का कोर्स है जो लीनियर रिग्रेशन, डिसीजन ट्री, SVM, और मॉडल परिनियोजन को कवर करता है!";
      }
      if (normalizedInput.includes("web development") || normalizedInput.includes("web dev") || normalizedInput.includes("वेब डेवलपमेंट") || normalizedInput.includes("html") || normalizedInput.includes("css")) {
        return "हमारे पास अपना कॉलेज के दो प्रीमियम वेब डेवलपमेंट कोर्स हैं: 18-पाठों का वेब डेवलपमेंट कोर्स और 57-पाठों का डेल्टा बूटकैम्प!";
      }
      if (normalizedInput.includes("design") || normalizedInput.includes("ui") || normalizedInput.includes("ux") || normalizedInput.includes("डिज़ाइन") || normalizedInput.includes("figma")) {
        return "UI/UX डिज़ाइनर डिजिटल इंटरफेस को उपयोगकर्ता के अनुकूल बनाते हैं। अपने कौशल को पूरा करने के लिए आप दृश्य डिज़ाइन सिद्धांत सीख सकते हैं!";
      }
      if (normalizedInput.includes("salary") || normalizedInput.includes("money") || normalizedInput.includes("pay") || normalizedInput.includes("वेतन") || normalizedInput.includes("पैसा")) {
        return "सॉफ्टवेयर इंजीनियर्स, वेब डेवलपर्स, और डेटा साइंटिस्ट की भारी मांग है। शुरुआती वेतन लगभग 5 लाख से 12 लाख रुपये प्रति वर्ष से शुरू होता है!";
      }
      if (normalizedInput.includes("code") || normalizedInput.includes("coding") || normalizedInput.includes("कोडिंग") || normalizedInput.includes("प्रोग्रामिंग")) {
        return "कोडिंग आज के युग की एक आवश्यक कौशल है। यदि आप शुरुआती हैं, तो जावास्क्रिप्ट या पायथन से शुरुआत करना सबसे अच्छा है!";
      }
      return "नमस्ते! मैं आपका करियर सलाहकार हूँ। कोडिंग, जावा, पायथन, वेब देव, रिएक्ट, डीबीएमएस, डीएसए, एमएल या वेतन के बारे में पूछें!";
    }

    // Find matching keyword
    for (const match of appData.botResponses.keywords) {
      for (const key of match.keys) {
        if (normalizedInput.includes(key)) {
          return match.response;
        }
      }
    }
    return appData.botResponses.default;
  }

  // --- MY PORTFOLIO ---
  function setupPortfolio() {
    const savedCareersList = document.getElementById('saved-careers-list');
    const completedSkillsList = document.getElementById('completed-skills-list');
    const portfolioXP = document.getElementById('portfolio-xp');
    const portfolioSkillsCount = document.getElementById('portfolio-skills-count');
    const portfolioCareersCount = document.getElementById('portfolio-careers-count');

    if (portfolioXP) portfolioXP.textContent = state.userXP;

    const isHindi = (state.language === 'hi');
    const noBookmarkedMsg = isHindi ? "अभी तक कोई बुकमार्क किया गया करियर नहीं है। करियर खोजक पर जाएँ!" : "No bookmarked careers yet. Browse the Career Explorer to save pathways!";
    const noActiveSkillsMsg = isHindi ? "अभी तक कोई सक्रिय कौशल नहीं है। सीखना शुरू करने के लिए कौशल हब पर जाएँ!" : "No active skills yet. Visit the Skills Hub to start learning!";
    const viewPathText = isHindi ? "पथ देखें" : "View Path";
    const resumeText = isHindi ? "जारी रखें" : "Resume";

    // Bookmarked Careers List
    if (savedCareersList) {
      if (state.bookmarkedCareers.length === 0) {
        savedCareersList.innerHTML = `<div style="color: var(--text-muted); font-size: 0.9rem; padding: 1rem 0;">${noBookmarkedMsg}</div>`;
      } else {
        let careerListHtml = '';
        state.bookmarkedCareers.forEach(id => {
          const career = appData.careers.find(c => c.id === id);
          if (career) {
            const catDisplay = isHindi ? (career.category === 'tech' ? 'तकनीकी' : career.category === 'creative' ? 'क्रिएटिव' : career.category === 'business' ? 'व्यवसाय' : 'विज्ञान') : career.category.toUpperCase();
            const displayTitle = (isHindi && careerTranslations[career.title]) ? careerTranslations[career.title].title : career.title;
            
            careerListHtml += `
              <div class="saved-item">
                <div class="saved-item-info">
                  <h5>${displayTitle}</h5>
                  <p>${catDisplay} • ${career.salary}</p>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                  <button class="btn btn-secondary view-path-portfolio-btn" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" data-id="${career.id}">${viewPathText}</button>
                  <button class="remove-btn remove-career-btn" data-id="${career.id}">✕</button>
                </div>
              </div>
            `;
          }
        });
        savedCareersList.innerHTML = careerListHtml;

        savedCareersList.querySelectorAll('.view-path-portfolio-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const career = appData.careers.find(c => c.id === id);
            if (career) openCareerModal(career);
          });
        });

        savedCareersList.querySelectorAll('.remove-career-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            toggleBookmark(id);
          });
        });
      }
      if (portfolioCareersCount) {
        portfolioCareersCount.textContent = state.bookmarkedCareers.length;
      }
    }

    // Skills Completion list
    if (completedSkillsList) {
      let completedSkills = [];
      let totalCompletedModules = 0;

      appData.skills.forEach(skill => {
        const total = skill.modules.length;
        const comp = skill.modules.filter(m => state.completedModules.includes(m.id)).length;
        totalCompletedModules += comp;

        if (comp > 0) {
          completedSkills.push({
            title: skill.title,
            percent: Math.round((comp / total) * 100),
            id: skill.id
          });
        }
      });

      if (completedSkills.length === 0) {
        completedSkillsList.innerHTML = `<div style="color: var(--text-muted); font-size: 0.9rem; padding: 1rem 0;">${noActiveSkillsMsg}</div>`;
      } else {
        let skillsListHtml = '';
        completedSkills.forEach(s => {
          const displaySkillTitle = (isHindi && skillTranslations[s.title]) ? skillTranslations[s.title] : s.title;

          skillsListHtml += `
            <div class="saved-item">
              <div class="saved-item-info" style="width: 70%">
                <h5>${displaySkillTitle}</h5>
                <div class="skill-progress-bar" style="margin-top: 0.5rem; height: 4px;">
                  <div class="skill-progress-fill" style="width: ${s.percent}%; background: var(--color-primary);"></div>
                </div>
              </div>
              <div style="display: flex; gap: 0.75rem; align-items: center;">
                <span style="font-size: 0.85rem; font-weight: 600; color: var(--color-primary)">${s.percent}%</span>
                <button class="btn btn-secondary resume-skill-portfolio-btn" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" data-id="${s.id}">${resumeText}</button>
              </div>
            </div>
          `;
        });
        completedSkillsList.innerHTML = skillsListHtml;

        completedSkillsList.querySelectorAll('.resume-skill-portfolio-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            openSkillRoadmapModal(id);
          });
        });
      }

      if (portfolioSkillsCount) {
        portfolioSkillsCount.textContent = totalCompletedModules;
      }
    }
  }

  // --- MODAL UTILS ---
  function openModal() {
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // --- AUTH LIFE CYCLES & CAPTCHA ---
  let currentCaptchaCode = '';

  function generateCaptcha() {
    const canvas = document.getElementById('captcha-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    currentCaptchaCode = '';
    for (let i = 0; i < 4; i++) {
      currentCaptchaCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    ctx.font = 'bold 20px monospace';
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 75%)`;
      ctx.save();
      const x = 20 + i * 22;
      const y = 25 + (Math.random() - 0.5) * 5;
      const angle = (Math.random() - 0.5) * 0.4;
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillText(currentCaptchaCode[i], 0, 0);
      ctx.restore();
    }
  }

  const authOverlay = document.getElementById('auth-overlay');

  function checkAuth() {
    if (!activeEmail) {
      if (authOverlay) {
        authOverlay.style.display = 'flex';
        generateCaptcha();
      }
    } else {
      if (authOverlay) {
        authOverlay.style.display = 'none';
      }
    }
  }

  function setupAuthEvents() {
    const toggleToSignUp = document.getElementById('toggle-to-signup');
    const toggleToSignIn = document.getElementById('toggle-to-signin');
    const signinPanel = document.getElementById('signin-panel');
    const signupPanel = document.getElementById('signup-panel');
    const captchaReload = document.getElementById('captcha-reload-btn');

    if (toggleToSignUp) {
      toggleToSignUp.addEventListener('click', () => {
        if (signinPanel && signupPanel) {
          signinPanel.style.display = 'none';
          signupPanel.style.display = 'block';
          generateCaptcha();
        }
      });
    }

    if (toggleToSignIn) {
      toggleToSignIn.addEventListener('click', () => {
        if (signinPanel && signupPanel) {
          signupPanel.style.display = 'none';
          signinPanel.style.display = 'block';
        }
      });
    }

    if (captchaReload) {
      captchaReload.addEventListener('click', generateCaptcha);
    }

    const signinForm = document.getElementById('signin-form');
    if (signinForm) {
      signinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signin-email').value.trim().toLowerCase();
        const password = document.getElementById('signin-password').value;

        if (useFirebase && state.authMode === 'firebase') {
          auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
              activeEmail = email;
              localStorage.setItem('pathfinder_active_email', email);
              loadUserState(email);
              checkAuth();
              switchTab('home');
              signinForm.reset();
            })
            .catch((error) => {
              console.error("Firebase Sign In Error:", error);
              alert("Error signing in: " + error.message);
            });
          return;
        }

        // Local Fallback Mode
        const user = usersDb[email];
        if (!user || user.password !== password) {
          alert('Invalid email address or password.');
          return;
        }

        activeEmail = email;
        localStorage.setItem('pathfinder_active_email', email);
        loadUserState(email);
        checkAuth();
        saveState();
        switchTab('home');
        signinForm.reset();
      });
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value.trim();
        const age = document.getElementById('signup-age').value.trim();
        const email = document.getElementById('signup-email').value.trim().toLowerCase();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        const captchaInput = document.getElementById('captcha-input').value.trim().toUpperCase();

        if (password !== confirmPassword) {
          alert('Passwords do not match.');
          return;
        }

        if (captchaInput !== currentCaptchaCode) {
          alert('Captcha verification failed. Please try again.');
          generateCaptcha();
          document.getElementById('captcha-input').value = '';
          return;
        }

        if (useFirebase && state.authMode === 'firebase') {
          auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
              const profile = { name, age, email };
              db.collection('users').doc(email).set(profile);

              const newInitialState = {
                userXP: 0,
                completedModules: [],
                bookmarkedCareers: []
              };
              db.collection('states').doc(email).set(newInitialState);

              activeEmail = email;
              localStorage.setItem('pathfinder_active_email', email);

              loadUserState(email, { profile, ...newInitialState });
              checkAuth();
              switchTab('home');
              signupForm.reset();
            })
            .catch((error) => {
              console.error("Firebase Sign Up Error:", error);
              alert("Error creating account: " + error.message);
            });
          return;
        }

        // Local Fallback Mode
        if (usersDb[email]) {
          alert('An account with this email address already exists.');
          return;
        }

        usersDb[email] = { name, age, email, password };
        localStorage.setItem('pathfinder_users', JSON.stringify(usersDb));

        const newInitialState = {
          userXP: 0,
          completedModules: [],
          bookmarkedCareers: []
        };
        localStorage.setItem(`pathfinder_state_${email}`, JSON.stringify(newInitialState));

        activeEmail = email;
        localStorage.setItem('pathfinder_active_email', email);
        loadUserState(email);
        checkAuth();
        saveState();
        switchTab('home');

        signupForm.reset();
      });
    }

    const profileWidget = document.getElementById('user-profile-widget');
    const dropdown = document.getElementById('profile-dropdown');
    const moreBtn = document.getElementById('nav-more-btn');
    const moreDropdown = document.getElementById('more-menu-dropdown');

    if (profileWidget && dropdown) {
      profileWidget.addEventListener('click', (e) => {
        e.stopPropagation();
        if (moreDropdown) moreDropdown.classList.remove('active');
        dropdown.classList.toggle('active');
      });

      document.addEventListener('click', () => {
        dropdown.classList.remove('active');
      });
    }

    if (moreBtn && moreDropdown) {
      moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dropdown) dropdown.classList.remove('active');
        moreDropdown.classList.toggle('active');
      });

      document.addEventListener('click', () => {
        moreDropdown.classList.remove('active');
      });
    }

    const langBtns = document.querySelectorAll('.language-btn');
    langBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedLang = btn.getAttribute('data-lang');
        changeLanguage(selectedLang);
        if (moreDropdown) moreDropdown.classList.remove('active');
      });
    });

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (useFirebase) {
          auth.signOut().catch(err => {
            console.error("Firebase Sign Out Error:", err);
          });
        }
        activeEmail = null;
        localStorage.removeItem('pathfinder_active_email');

        dropdown.classList.remove('active');
        checkAuth();
      });
    }
  }

  // --- REVIEWS & SUGGESTIONS ENGINE ---
  function setupFeedback() {
    const stars = document.querySelectorAll('.rating-star');
    const ratingInput = document.getElementById('feedback-rating-val');
    
    if (stars.length > 0 && ratingInput) {
      stars.forEach(star => {
        // Hover rating star
        star.addEventListener('mouseover', () => {
          const val = parseInt(star.getAttribute('data-value'));
          stars.forEach(s => {
            if (parseInt(s.getAttribute('data-value')) <= val) {
              s.classList.add('hovered');
            } else {
              s.classList.remove('hovered');
            }
          });
        });
        
        star.addEventListener('mouseout', () => {
          stars.forEach(s => s.classList.remove('hovered'));
        });
        
        // Select rating star
        star.addEventListener('click', () => {
          const val = parseInt(star.getAttribute('data-value'));
          ratingInput.value = val;
          stars.forEach(s => {
            if (parseInt(s.getAttribute('data-value')) <= val) {
              s.classList.add('selected');
              s.textContent = '★';
            } else {
              s.classList.remove('selected');
              s.textContent = '☆';
            }
          });
        });
      });
    }

    const resetStars = () => {
      if (ratingInput) ratingInput.value = '0';
      stars.forEach(s => {
        s.classList.remove('selected');
        s.textContent = '☆';
      });
    };

    const feedbackForm = document.getElementById('feedback-form');
    if (feedbackForm) {
      feedbackForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('feedback-name').value.trim();
        const rating = parseInt(ratingInput.value);
        const text = document.getElementById('feedback-text').value.trim();
        
        if (rating === 0) {
          alert("Please select a star rating!");
          return;
        }
        
        const reviewData = {
          name,
          rating,
          text,
          email: activeEmail || 'guest@example.com',
          timestamp: Date.now()
        };
        
        if (useFirebase) {
          db.collection('reviews').add(reviewData)
            .then(() => {
              feedbackForm.reset();
              resetStars();
              // Re-fill name if logged in
              const activeUser = localStorage.getItem('pathfinder_active_email');
              if (activeUser && useFirebase) {
                db.collection('users').doc(activeUser).get().then(doc => {
                  if (doc.exists) {
                    const feedbackName = document.getElementById('feedback-name');
                    if (feedbackName) feedbackName.value = doc.data().name;
                  }
                });
              }
              alert("Thank you for your feedback!");
            })
            .catch(err => {
              console.error("Error submitting review to Firebase:", err);
              alert("Error submitting review: " + err.message);
            });
        } else {
          // Local fallback
          const reviews = JSON.parse(localStorage.getItem('pathfinder_reviews') || '[]');
          reviews.unshift(reviewData);
          localStorage.setItem('pathfinder_reviews', JSON.stringify(reviews));
          feedbackForm.reset();
          resetStars();
          // Re-fill name if logged in
          if (activeEmail && usersDb[activeEmail]) {
            const feedbackName = document.getElementById('feedback-name');
            if (feedbackName) feedbackName.value = usersDb[activeEmail].name;
          }
          alert("Thank you for your feedback!");
          renderReviewsList();
        }
      });
    }

    // Load initial reviews list
    if (useFirebase) {
      db.collection('reviews').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
        let reviewsList = [];
        snapshot.forEach(doc => {
          reviewsList.push(doc.data());
        });
        renderReviews(reviewsList);
      }, err => {
        console.error("Firestore reviews subscription error:", err);
      });
    } else {
      renderReviewsList();
    }
  }

  function renderReviewsList() {
    const reviews = JSON.parse(localStorage.getItem('pathfinder_reviews') || '[]');
    renderReviews(reviews);
  }

  function renderReviews(reviewsArray) {
    const feed = document.getElementById('reviews-feed');
    if (!feed) return;
    
    if (reviewsArray.length === 0) {
      feed.innerHTML = `<div style="color: var(--text-muted); font-size: 0.95rem; padding: 2rem 0; text-align: center;">No reviews yet. Be the first to share your thoughts!</div>`;
      return;
    }
    
    let html = '';
    reviewsArray.forEach(rev => {
      const starStr = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);
      const dateStr = new Date(rev.timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      html += `
        <div class="feedback-card" style="margin-bottom: 1rem;">
          <div class="feedback-card-header">
            <span class="feedback-card-user">${escapeHtml(rev.name)}</span>
            <span class="feedback-card-stars">${starStr}</span>
          </div>
          <div class="feedback-card-date">${dateStr}</div>
          <div class="feedback-card-text">${escapeHtml(rev.text)}</div>
        </div>
      `;
    });
    feed.innerHTML = html;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // --- KICKSTART ---
  init();
});
