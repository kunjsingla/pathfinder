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
    activeSkillId: null
  };

  function loadUserState(email, dataObj = null) {
    if (dataObj) {
      state.userXP = dataObj.userXP || 0;
      state.completedModules = dataObj.completedModules || [];
      state.bookmarkedCareers = dataObj.bookmarkedCareers || [];
      state.quizAnswers = {};
      state.quizCurrentQuestion = 0;
      updateUIForUser(email, dataObj.profile);
      return;
    }

    if (useFirebase && activeEmail) {
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

  function showQuizQuestion() {
    const quizArea = document.getElementById('quiz-dynamic-area');
    const qCount = appData.quizQuestions.length;

    if (state.quizCurrentQuestion >= qCount) {
      showQuizResults();
      return;
    }

    const question = appData.quizQuestions[state.quizCurrentQuestion];
    const progressPercent = Math.round((state.quizCurrentQuestion / qCount) * 100);

    let optionsHtml = '';
    question.options.forEach((opt, idx) => {
      optionsHtml += `
        <button class="quiz-option-btn" data-category="${opt.category}">
          ${opt.text}
        </button>
      `;
    });

    quizArea.innerHTML = `
      <div class="progress-bar-container">
        <div class="progress-bar-fill" style="width: ${progressPercent}%"></div>
      </div>
      <div class="quiz-question-number">Question ${state.quizCurrentQuestion + 1} of ${qCount}</div>
      <h3 class="quiz-question-text">${question.text}</h3>
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

    // Generate matched careers HTML
    let careersHtml = '';
    matchedCareers.forEach(c => {
      careersHtml += `
        <div class="matched-career-box" style="margin-bottom: 0.75rem; text-align: left; padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: rgba(255,255,255,0.02); display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
          <div style="flex: 1; min-width: 0;">
            <h5 style="margin: 0 0 0.25rem 0; font-size: 0.95rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.title}</h5>
            <p style="margin: 0; font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${c.shortDesc}</p>
          </div>
          <button class="btn btn-secondary view-path-btn" data-id="${c.id}" style="padding: 0.35rem 0.7rem; font-size: 0.75rem; white-space: nowrap;">Explore Path →</button>
        </div>
      `;
    });

    quizArea.innerHTML = `
      <div class="results-card" style="text-align: center;">
        <div class="results-icon" style="margin-bottom: 0.5rem;">🏆</div>
        <h2 class="gradient-text" style="font-size: 2rem; margin-bottom: 0.25rem;">Assessment Complete!</h2>
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem; font-size: 0.9rem;">Based on your choices, you have strong alignment with the <strong>${matchCat.toUpperCase()}</strong> path.</p>
        
        <div style="display: flex; flex-direction: column; gap: 1.5rem; text-align: left; margin-bottom: 1.5rem;">
          
          <!-- Career Recommendations Column -->
          <div style="flex: 1;">
            <h4 style="font-size: 0.95rem; color: var(--color-primary); margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Recommended Careers to Follow:</h4>
            ${careersHtml}
          </div>
          
          <!-- Skill Recommendation Column -->
          <div class="matched-career-box" style="padding: 1.25rem; border: 1px dashed var(--color-secondary); border-radius: 12px; background: rgba(255, 255, 255, 0.02); flex: 1;">
            <h4 style="font-size: 0.95rem; color: var(--color-secondary); margin-top: 0; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">🎯 Recommended Skill to Learn First:</h4>
            <div style="display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1rem;">
              <span style="font-size: 2.2rem; line-height: 1;">${recommendedSkill.image}</span>
              <div>
                <h5 style="margin: 0 0 0.15rem 0; font-size: 1rem; font-weight: 700; color: #fff;">${recommendedSkill.title}</h5>
                <p style="margin: 0; font-size: 0.75rem; color: var(--text-secondary);">${recommendedSkill.time}</p>
                <p style="margin: 0.4rem 0 0 0; font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4;">Coding is an essential superpower for a ${matchCat} career. Start this roadmap now to level up your portfolio!</p>
              </div>
            </div>
            <button class="btn btn-primary start-rec-skill-btn" data-id="${recommendedSkill.id}" style="width: 100%; padding: 0.55rem; font-size: 0.85rem;">Start Skill Learning Roadmap</button>
          </div>
          
        </div>

        ${xpEarned > 0 ? `<p style="color: var(--color-success); font-weight: 600; margin-bottom: 1.25rem; font-size: 0.9rem;">🎉 +${xpEarned} XP awarded for completion!</p>` : ''}

        <div style="display: flex; justify-content: center; gap: 1rem;">
          <button class="btn btn-secondary" id="restart-quiz-btn" style="padding: 0.5rem 1.25rem; font-size: 0.85rem;">Retake Assessment</button>
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

    if (filtered.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 3rem;">No careers match your search criteria.</div>`;
      return;
    }

    let cardsHtml = '';
    filtered.forEach(career => {
      const isBookmarked = state.bookmarkedCareers.includes(career.id);
      const bookmarkIconHtml = isBookmarked ? '★ Bookmarked' : '☆ Bookmark';

      cardsHtml += `
        <div class="glass-card career-card" data-id="${career.id}">
          <span class="career-tag">${career.category}</span>
          <h3>${career.title}</h3>
          <p>${career.shortDesc}</p>
          <div class="career-meta">
            <div>
              <span class="meta-label">Est. Salary</span>
              <span class="meta-value">${career.salary}</span>
            </div>
            <div>
              <span class="meta-label">Job Growth</span>
              <span class="meta-value" style="color: var(--color-success)">${career.growth.split(' ')[0]}</span>
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-secondary bookmark-btn" style="flex: 1; font-size: 0.85rem;" data-id="${career.id}">${bookmarkIconHtml}</button>
            <button class="btn btn-primary explore-details-btn" style="flex: 1.2; font-size: 0.85rem;" data-id="${career.id}">View Path →</button>
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
    let skillListHtml = '';
    career.skillsRequired.forEach(sk => {
      skillListHtml += `<li>${sk}</li>`;
    });

    let pathwayListHtml = '';
    career.pathway.forEach(p => {
      pathwayListHtml += `<li>${p}</li>`;
    });

    let resourcesHtml = '';
    career.resources.forEach(r => {
      resourcesHtml += `<a href="${r.url}" target="_blank" rel="noopener" class="resource-link">${r.title} ↗</a>`;
    });

    const isBookmarked = state.bookmarkedCareers.includes(career.id);

    modalBody.innerHTML = `
      <h2 class="modal-title">${career.title}</h2>
      <div class="modal-subtitle" style="display: flex; justify-content: space-between; align-items: center;">
        <span>${career.category.toUpperCase()} PATHWAY</span>
        <button class="btn btn-secondary" id="modal-bookmark-toggle" data-id="${career.id}" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">
          ${isBookmarked ? '★ Bookmarked' : '☆ Bookmark'}
        </button>
      </div>

      <div class="detail-section">
        <h5>Career Overview</h5>
        <p>${career.desc}</p>
      </div>

      <div class="detail-section">
        <h5>Key Metrics</h5>
        <p><strong>Average Salary:</strong> ${career.salary}</p>
        <p><strong>Employment Outlook:</strong> ${career.growth}</p>
        <p><strong>Path Difficulty:</strong> ${career.difficulty}</p>
      </div>

      <div class="detail-section">
        <h5>Key Skills Required</h5>
        <ul class="detail-list">
          ${skillListHtml}
        </ul>
      </div>

      <div class="detail-section">
        <h5>Recommended Career Path</h5>
        <ul class="detail-list" style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${pathwayListHtml}
        </ul>
      </div>

      <div class="detail-section">
        <h5>External Study Resources</h5>
        <div class="resources-list">
          ${resourcesHtml}
        </div>
      </div>
    `;

    document.getElementById('modal-bookmark-toggle').addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      toggleBookmark(id);
      e.target.textContent = state.bookmarkedCareers.includes(id) ? '★ Bookmarked' : '☆ Bookmark';
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

    let skillsHtml = '';
    appData.skills.forEach(skill => {
      // Calculate progress
      const totalModules = skill.modules.length;
      const completedCount = skill.modules.filter(m => state.completedModules.includes(m.id)).length;
      const progressPercent = Math.round((completedCount / totalModules) * 100);

      skillsHtml += `
        <div class="glass-card skill-card">
          <div class="skill-card-header">
            <span class="skill-icon">${skill.image}</span>
            <span class="skill-time">${skill.time}</span>
          </div>
          <h3>${skill.title}</h3>
          
          <div class="skill-progress-wrapper">
            <div class="skill-progress-text">
              <span>Progress</span>
              <span>${progressPercent}%</span>
            </div>
            <div class="skill-progress-bar">
              <div class="skill-progress-fill" style="width: ${progressPercent}%; background: var(--color-secondary)"></div>
            </div>
          </div>

          <button class="btn btn-primary start-skill-btn" style="width: 100%;" data-id="${skill.id}">
            ${progressPercent === 100 ? 'Review Roadmap' : (progressPercent > 0 ? 'Continue Roadmap' : 'Start Learning →')}
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

      let modulesHtml = '';
      skill.modules.forEach(mod => {
        const isCompleted = state.completedModules.includes(mod.id);
        modulesHtml += `
          <div class="module-item" style="flex-direction: column; align-items: stretch; gap: 0.75rem;">
            <div style="display: flex; gap: 1rem; align-items: flex-start; width: 100%;">
              <input type="checkbox" class="module-checkbox" data-id="${mod.id}" ${isCompleted ? 'checked' : ''}>
              <div class="module-info" style="flex: 1;">
                <h5>${mod.title}</h5>
                <p>${mod.desc}</p>
              </div>
              ${mod.playlistIndex !== undefined || mod.videoId ? `<button class="btn btn-secondary toggle-video-btn" style="padding: 0.35rem 0.7rem; font-size: 0.75rem; min-width: 90px;" data-video-id="${mod.videoId || ''}" data-start="${mod.start || 0}" data-playlist-index="${mod.playlistIndex !== undefined ? mod.playlistIndex : ''}">🎥 Watch</button>` : ''}
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
        <h2 class="modal-title">${skill.title}</h2>
        <div class="modal-subtitle">Track your milestones. Each checked module grants +20 XP.</div>

        <div class="module-list" style="margin-bottom: 2rem;">
          ${modulesHtml}
        </div>

        <button class="btn btn-primary" id="close-modal-btn" style="width: 100%">Close Roadmap</button>
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
              otherBtn.innerHTML = '🎥 Watch';
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
            } else {
              iframe.src = `https://www.youtube.com/embed/${videoId}?start=${startTime}&autoplay=1`;
            }
            btn.innerHTML = '✕ Close';
          } else {
            videoContainer.style.display = 'none';
            iframe.src = '';
            btn.innerHTML = '🎥 Watch';
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

    // Bookmarked Careers List
    if (savedCareersList) {
      if (state.bookmarkedCareers.length === 0) {
        savedCareersList.innerHTML = `<div style="color: var(--text-muted); font-size: 0.9rem; padding: 1rem 0;">No bookmarked careers yet. Browse the Career Explorer to save pathways!</div>`;
      } else {
        let careerListHtml = '';
        state.bookmarkedCareers.forEach(id => {
          const career = appData.careers.find(c => c.id === id);
          if (career) {
            careerListHtml += `
              <div class="saved-item">
                <div class="saved-item-info">
                  <h5>${career.title}</h5>
                  <p>${career.category.toUpperCase()} • ${career.salary}</p>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                  <button class="btn btn-secondary view-path-portfolio-btn" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" data-id="${career.id}">View Path</button>
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
        completedSkillsList.innerHTML = `<div style="color: var(--text-muted); font-size: 0.9rem; padding: 1rem 0;">No active skills yet. Visit the Skills Hub to start learning!</div>`;
      } else {
        let skillsListHtml = '';
        completedSkills.forEach(s => {
          skillsListHtml += `
            <div class="saved-item">
              <div class="saved-item-info" style="width: 70%">
                <h5>${s.title}</h5>
                <div class="skill-progress-bar" style="margin-top: 0.5rem; height: 4px;">
                  <div class="skill-progress-fill" style="width: ${s.percent}%; background: var(--color-primary);"></div>
                </div>
              </div>
              <div style="display: flex; gap: 0.75rem; align-items: center;">
                <span style="font-size: 0.85rem; font-weight: 600; color: var(--color-primary)">${s.percent}%</span>
                <button class="btn btn-secondary resume-skill-portfolio-btn" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" data-id="${s.id}">Resume</button>
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

        if (useFirebase) {
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

        if (useFirebase) {
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

    if (profileWidget && dropdown) {
      profileWidget.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
      });

      document.addEventListener('click', () => {
        dropdown.classList.remove('active');
      });
    }

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
