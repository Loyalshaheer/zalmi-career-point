document.addEventListener('DOMContentLoaded', () => {

    // ============================================================
    //  FIREBASE INIT
    // ============================================================
    const firebaseConfig = {
        apiKey: "AIzaSyB4KG8r1XRpW60ZoYsYQnFGwYoadmDhFHg",
        authDomain: "zalmi-career-point.firebaseapp.com",
        projectId: "zalmi-career-point",
        storageBucket: "zalmi-career-point.firebasestorage.app",
        messagingSenderId: "137170146690",
        appId: "1:137170146690:web:7f3ec8f2059e4b780a2b9b",
        measurementId: "G-H6ZJC8EYPS"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const auth    = firebase.auth();
    const db      = firebase.firestore();
    const storage = (typeof firebase.storage === 'function') ? firebase.storage() : null;

    // Admin email — sole access to Admin Console
    const ADMIN_EMAILS = ['loyalshaheer05@gmail.com'];

    // ============================================================
    //  SCROLL REVEAL (for landing page)
    // ============================================================
    const revealElements = document.querySelectorAll('[data-reveal]');
    if (revealElements.length) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('is-revealed');
            });
        }, { rootMargin: '0px', threshold: 0.12 });
        setTimeout(() => revealElements.forEach(el => observer.observe(el)), 100);
    }

    // ============================================================
    //  HEADER SCROLL FX
    // ============================================================
    const header = document.querySelector('.glass-header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 50);
        }, { passive: true });
    }

    // ============================================================
    //  MOBILE MENU (Landing Page)
    // ============================================================
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks  = document.querySelector('.pd-nav-links');
    
    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });
    }

    // ============================================================
    //  DYNAMIC COURSES (Landing Page)
    // ============================================================
    let activeCourses = [];

    async function fetchAndRenderCourses() {
        const landingCols = document.getElementById('coursesContainer');
        const dashGrid    = document.getElementById('availableCoursesGrid');
        const select      = document.getElementById('course');
        
        if (!landingCols && !dashGrid && !select) return;

        try {
            const snap = await db.collection('courses').get();
            const allFetched = [];
            snap.forEach(doc => allFetched.push({ id: doc.id, ...doc.data() }));

            activeCourses = allFetched
                .filter(c => String(c.status || '').toLowerCase() === 'live')
                .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

            // Populate Dropdown (Used in both Index & Dashboard modals)
            if (select) {
                select.innerHTML = '<option value="" disabled selected>Select a program</option>' + 
                    activeCourses.map(c => `<option value="${c.id}">${sanitize(c.title)}</option>`).join('');
            }

            // Render on Landing Page
            if (landingCols) {
                if (activeCourses.length === 0) {
                    landingCols.innerHTML = `<div style="grid-column: span 12; text-align: center; padding: 4rem; opacity:0.6;"><p>New programs launching soon. Stay tuned!</p></div>`;
                } else {
                    landingCols.innerHTML = activeCourses.map((c, i) => {
                        const isFeatured = i === 0;
                        const colClass = isFeatured ? 'pd-card-featured' : 'pd-card-third';
                        return `
                            <div class="pd-card ${colClass}" data-reveal="fade-up">
                                ${isFeatured ? '<div class="pd-card-glow"></div>' : ''}
                                <div class="pd-tag"><i class="fas fa-broadcast-tower"></i> Live Batch Open</div>
                                <h3 class="${isFeatured ? 'pd-card-title' : 'pd-card-sm-title'}">${sanitize(c.title)}</h3>
                                <p class="${isFeatured ? 'pd-card-body' : 'pd-card-sm-body'}">${sanitize(c.description || c.eligibility)}</p>
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">
                                    <div style="font-size:0.9rem; color:var(--text-secondary);">
                                        <strong>${sanitize(c.startTime)}</strong><br>
                                        <span style="font-size:0.75rem;">${sanitize(c.timing)}</span>
                                    </div>
                                    <a href="login.html?mode=signup" class="pd-btn-primary" style="padding: 0.6rem 1.2rem; font-size: 0.85rem;">Enroll Now</a>
                                </div>
                            </div>
                        `;
                    }).join('');
                    initRevealObserver(landingCols);
                }
            }

            // Render on Dashboard (Available Programs)
            if (dashGrid) {
                if (activeCourses.length === 0) {
                    const container = document.getElementById('available-programs-container');
                    if (container) container.style.display = 'none';
                } else {
                    dashGrid.innerHTML = activeCourses.map(c => `
                        <div class="course-card glass-card" style="padding:0; overflow:hidden; border:1px solid rgba(255,255,255,0.05); transition: 0.3s; height: 100%; display: flex; flex-direction: column;">
                            <div class="course-image" style="height:140px; position:relative;">
                                <img src="${c.imageUrl || 'assets/course-placeholder.png'}" alt="${sanitize(c.title)}" style="width:100%; height:100%; object-fit:cover;">
                                <div style="position:absolute; top:12px; right:12px; background:var(--amber); color:black; font-weight:700; font-size:0.65rem; padding:3px 10px; border-radius:100px;">NEW BATCH</div>
                            </div>
                            <div style="padding:1.25rem; flex: 1; display: flex; flex-direction: column;">
                                <h3 style="font-size:1rem; color:white; margin-bottom:0.75rem;">${sanitize(c.title)}</h3>
                                <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:1.5rem; flex: 1;">
                                    <span style="font-size:0.78rem; color:rgba(255,255,255,0.5);"><i class="fas fa-calendar" style="color:var(--amber); margin-right:6px;"></i> ${sanitize(c.startTime)}</span>
                                    <span style="font-size:0.78rem; color:rgba(255,255,255,0.5);"><i class="fas fa-tag" style="color:var(--amber); margin-right:6px;"></i> Rs ${c.price}</span>
                                </div>
                                <button onclick="openEnrollModal('${c.id}')" class="btn btn-primary btn-block" style="border-radius:10px; font-size: 0.8rem; height: 42px;">
                                    ENROLL NOW
                                </button>
                            </div>
                        </div>
                    `).join('');
                }
            }

        } catch (err) { console.error('Error fetching courses:', err); }
    }

    function initRevealObserver(container) {
        const newElements = container.querySelectorAll('[data-reveal]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('is-revealed'); });
        }, { threshold: 0.1 });
        newElements.forEach(el => observer.observe(el));
    }

    window.openEnrollModal = async (courseId) => {
        const modal  = document.getElementById('enrollModal');
        const select = document.getElementById('course');
        if (!modal) return;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (courseId && select) {
            select.value = courseId;
            updateCourseDisplay(courseId);
        }

        // Auto-fill student data from their profile
        const user = auth.currentUser;
        if (user) {
            try {
                const doc = await db.collection('students').doc(user.uid).get();
                if (doc.exists) {
                    const data = doc.data();
                    const nameInput  = document.getElementById('fullName');
                    const phoneInput = document.getElementById('whatsapp');
                    const emailInput = document.getElementById('email'); // if exists
                    
                    if (nameInput)  nameInput.value  = data.fullName || '';
                    if (phoneInput) phoneInput.value = data.phone || '';
                    if (emailInput) emailInput.value = data.email || user.email;
                }
            } catch (err) { console.error('Prefill error:', err); }
        }
    };

    window.closeEnrollModal = () => {
        const modal = document.getElementById('enrollModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    // Update price and status message in enrollment form
    window.updateCourseDisplay = (courseId) => {
        const c = activeCourses.find(x => x.id === courseId);
        const statusMsg = document.getElementById('courseStatusMsg');
        const statusText = document.getElementById('courseStatusText');
        const amountDue = document.getElementById('amountDue');

        if (c) {
            if (amountDue) amountDue.textContent = `Rs ${c.price}`;
            if (statusMsg) {
                if (c.status === 'live') {
                    statusMsg.style.display = 'none';
                } else {
                    statusMsg.style.display = 'block';
                    if (statusText) statusText.textContent = `This program is currently ${c.status}.`;
                }
            }
        }
    };

    function sanitize(str) {
        return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    fetchAndRenderCourses();

    // ============================================================
    //  ENROLLMENT FORM & PAYMENT (Landing Page)
    // ============================================================
    const enrollForm     = document.getElementById('enrollmentForm');
    const paymentStep    = document.getElementById('paymentStep');
    const formSuccess    = document.getElementById('formSuccess');
    const confirmPayBtn  = document.getElementById('confirmPaymentBtn');

    if (enrollForm) {
        enrollForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData  = new FormData(this);
            const data      = Object.fromEntries(formData.entries());
            const submitBtn = this.querySelector('button[type="submit"]');
            const btnText   = submitBtn.querySelector('.btn-text') || submitBtn;
            const origText  = btnText.textContent;

            submitBtn.disabled = true;
            btnText.textContent = 'Saving...';

            try {
                const docRef = await db.collection('enrollments').add({
                    ...data,
                    courseId:       data.course,
                    courseName:     activeCourses.find(c => c.id === data.course)?.title || data.course,
                    status:         'form_submitted',
                    paymentStatus:  'pending',
                    submittedAt:    firebase.firestore.FieldValue.serverTimestamp(),
                    uid:            auth.currentUser ? auth.currentUser.uid : null
                });

                localStorage.setItem('pendingEnrollmentId', docRef.id);
                localStorage.setItem('pendingEnrollment',   JSON.stringify(data));

                enrollForm.style.display = 'none';
                if (paymentStep) paymentStep.style.display = 'block';

                const modalBody = document.querySelector('.adm-modal');
                if (modalBody) modalBody.scrollTo({ top: 0, behavior: 'smooth' });

            } catch (err) {
                console.error('Enrollment save error:', err);
                alert(`Could not save your enrollment: ${err.message}`);
                submitBtn.disabled = false;
                btnText.textContent = origText;
            }
        });
    }

    if (confirmPayBtn) {
        confirmPayBtn.addEventListener('click', async () => {
            const docId   = localStorage.getItem('pendingEnrollmentId');
            const fileEl  = document.getElementById('paymentReceipt');
            const method  = document.querySelector('.pd-method-card.active, .payment-method-card.active')?.dataset.method || 'unknown';

            if (!docId) { alert('Session expired. Please fill the form again.'); return; }

            confirmPayBtn.disabled = true;
            const origHtml = confirmPayBtn.innerHTML;
            confirmPayBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

            try {
                let receiptUrl = null;

                // 1. Handle Receipt Upload if file exists
                if (fileEl && fileEl.files[0]) {
                    const file = fileEl.files[0];
                    if (file.size > 2 * 1024 * 1024) throw new Error('File size too large (Max 2MB)');
                    
                    const fileRef = storage.ref(`enrollments/receipts/${docId}_${Date.now()}`);
                    const uploadTask = await fileRef.put(file);
                    receiptUrl = await uploadTask.ref.getDownloadURL();
                }

                // 2. Update Firestore
                await db.collection('enrollments').doc(docId).update({
                    paymentMethod:  method,
                    receiptUrl:     receiptUrl,
                    status:         'payment_confirmed',
                    paymentStatus:  'pending_verification',
                    confirmedAt:    firebase.firestore.FieldValue.serverTimestamp()
                });

                localStorage.removeItem('pendingEnrollmentId');
                localStorage.removeItem('pendingEnrollment');

                if (paymentStep) paymentStep.style.display = 'none';
                if (formSuccess) {
                    formSuccess.style.display = 'block';
                    const modalBody = document.querySelector('.enroll-modal');
                    if (modalBody) modalBody.scrollTo({ top: 0, behavior: 'smooth' });
                    if (typeof triggerConfetti === 'function') triggerConfetti();
                    if (typeof showToast === 'function') showToast('Payment submitted for verification!', 'success');
                }

            } catch (err) {
                console.error('Payment confirm error:', err);
                alert(`Error: ${err.message}`);
                confirmPayBtn.disabled = false;
                confirmPayBtn.innerHTML = origHtml;
            }
        });
    }

    // ============================================================
    //  LOGIN / REGISTER (login.html)
    // ============================================================
    const loginForm      = document.getElementById('loginForm');
    const toggleAuth     = document.getElementById('toggleAuth');
    const authTitle      = document.getElementById('authTitle');
    const authSubtitle   = document.getElementById('authSubtitle');
    const registerFields = document.getElementById('registerFields');
    const authErrorMsg   = document.getElementById('errorMsg');

    let isLogin = true;

    if (toggleAuth && loginForm) {
        // Handle URL parameters for mode
        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'signup') {
            isLogin = false;
            authTitle.textContent = 'Create account';
            authSubtitle.textContent = 'Join Zalmi Career Point today.';
            registerFields.style.display = 'block';
            toggleAuth.textContent = 'Sign in instead';
            const btnText = loginForm.querySelector('.auth-submit-btn .btn-text');
            if (btnText) btnText.textContent = 'Create Account';
            document.body.classList.add('signup-mode'); 
        } else if (params.get('registered') === 'true') {
            authSubtitle.textContent = 'Registration successful! Please sign in below.';
            authSubtitle.style.color = 'var(--amber)';
        }

        toggleAuth.addEventListener('click', e => {
            e.preventDefault();
            isLogin = !isLogin;
            if (authErrorMsg) authErrorMsg.style.display = 'none';

            if (isLogin) {
                authTitle.textContent = 'Welcome back';
                authSubtitle.textContent = 'Sign in to access your student dashboard.';
                registerFields.style.display = 'none';
                toggleAuth.textContent = 'Create account';
                loginForm.querySelector('.auth-submit-btn .btn-text').textContent = 'Sign In to Dashboard';
            } else {
                authTitle.textContent = 'Create account';
                authSubtitle.textContent = 'Join Zalmi Career Point today.';
                registerFields.style.display = 'block';
                toggleAuth.textContent = 'Sign in instead';
                loginForm.querySelector('.auth-submit-btn .btn-text').textContent = 'Create Account';
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async e => {
            e.preventDefault();
            if (authErrorMsg) authErrorMsg.style.display = 'none';

            const email    = document.getElementById('loginEmail')?.value?.trim();
            const password = document.getElementById('loginPassword')?.value;
            const submitBtn = loginForm.querySelector('.auth-submit-btn');
            const origHtml = submitBtn.innerHTML;

            if (!email || !password) return;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SIGNING IN...';

            try {
                if (isLogin) {
                    await auth.signInWithEmailAndPassword(email, password);
                    // Centralized redirection is handled by onAuthStateChanged
                } else {
                    const fullName = document.getElementById('regFullName')?.value?.trim();
                    const phone    = document.getElementById('regPhone')?.value?.trim();
                    if (!fullName || !phone) throw new Error('Fill in all fields');

                    const { user } = await auth.createUserWithEmailAndPassword(email, password);
                    await db.collection('students').doc(user.uid).set({
                        fullName, phone, email,
                        rollNumber: 'ZCP-' + Math.floor(1000 + Math.random() * 9000),
                        status: 'New Member',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    // Professional Success Flow
                    const successModal = document.getElementById('registrationSuccess');
                    if (successModal) {
                        successModal.classList.add('active');
                        if (typeof triggerConfetti === 'function') triggerConfetti();
                        
                        // Explicitly sign out so the student can perform a clean manual login
                        await auth.signOut();

                        // Hard Redirect to Login Page after 2.5 seconds
                        setTimeout(() => {
                            window.location.href = 'login.html?registered=true';
                        }, 2500);
                    } else {
                        await auth.signOut();
                        window.location.href = 'login.html?registered=true';
                    }
                }
            } catch (err) {
                console.error('Auth error:', err);
                if (authErrorMsg) { authErrorMsg.textContent = err.message; authErrorMsg.style.display = 'block'; }
                submitBtn.disabled = false;
                submitBtn.innerHTML = origHtml;
            }
        });
    }

    // ============================================================
    //  DASHBOARD INITIALIZATION (dashboard.html)
    // ============================================================
    auth.onAuthStateChanged(async user => {
        if (!user) {
            if (document.body.classList.contains('dashboard-page')) window.location.href = 'login.html';
            return;
        }

        // Automatic Redirect from Login page IF user is already authenticated
        if (document.body.classList.contains('auth-page')) {
            console.log('User already authenticated, redirecting to dashboard...');
            window.location.replace('dashboard.html');
            return;
        }

        // Initialize Dashboard View
        if (document.body.classList.contains('dashboard-page')) {
            loadDashboardData(user);
            initDashboardNav();
            
            // Check for admin
            if (ADMIN_EMAILS.includes(user.email)) {
                const adminTab = document.getElementById('admin-portal-tab');
                if (adminTab) adminTab.style.display = 'flex';
            }
        }

        // Initialize Admin Page View
        if (window.location.pathname.includes('admin.html')) {
            if (!ADMIN_EMAILS.includes(user.email)) { window.location.href = 'dashboard.html'; return; }
            loadAdminData();
        }
    });

    async function loadDashboardData(user) {
        try {
            const doc = await db.collection('students').doc(user.uid).get();
            if (doc.exists) {
                const data = doc.data();
                setText('userName', data.fullName.split(' ')[0] || 'Student');
                setText('displayFullName', data.fullName);
                setText('userRoll', 'Roll #' + (data.rollNumber || 'ZCP-2026-***'));
                setText('totalCourses', data.coursesCount || '0');
                setText('totalLessons', data.lessonsCompleted || '0');
                setText('avgScore', (data.avgPerformance || '0') + '%');
            }

            // Load Student Enrollments
            const enrollSnap = await db.collection('enrollments')
                .where('email', '==', user.email)
                .where('status', 'in', ['active', 'payment_confirmed'])
                .get();

            const coursesContainer = document.getElementById('coursesContainer');
            const availContainer   = document.getElementById('available-programs-container');

            if (coursesContainer) {
                if (enrollSnap.empty) {
                    coursesContainer.innerHTML = `
                        <div style="grid-column:1/-1; text-align:center; padding:5rem 2rem; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.1); border-radius:24px;">
                            <div style="background:var(--amber-dim); color:var(--amber); width:64px; height:64px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem; font-size:1.5rem;">
                                <i class="fas fa-graduation-cap"></i>
                            </div>
                            <h3 style="font-size:1.25rem; color:white; margin-bottom:0.5rem;">Welcome to the Academy!</h3>
                            <p style="color:var(--text-muted); font-size:0.9rem; max-width:400px; margin:0 auto 1.5rem;">You haven't enrolled in any programs yet. Browse our available courses below to start learning.</p>
                            <button onclick="document.getElementById('available-programs-container').scrollIntoView({behavior:'smooth'})" class="btn btn-ghost" style="color:var(--amber); font-weight:700;">BROWSE COURSES <i class="fas fa-arrow-down" style="margin-left:8px;"></i></button>
                        </div>`;
                    if (availContainer) availContainer.style.display = 'block';
                } else {
                    if (availContainer) availContainer.style.display = 'block'; // Keep it visible for multi-course students
                    let html = '';
                    for (const enrollDoc of enrollSnap.docs) {
                        const enrollData = enrollDoc.data();
                        const courseDoc = await db.collection('courses').doc(enrollData.courseId || enrollData.course).get();
                        const c = courseDoc.exists ? courseDoc.data() : { title: enrollData.courseName || enrollData.course, imageUrl: 'assets/course-placeholder.png' };
                        const status = enrollData.status || (enrollData.paymentStatus === 'verified' ? 'active' : 'pending');

                        html += `
                            <div class="course-card glass-card" style="padding:0; overflow:hidden; border:1px solid rgba(255,255,255,0.05);">
                                <div class="course-image" style="height:160px; position:relative;">
                                    <img src="${c.imageUrl || 'assets/course-placeholder.png'}" alt="${c.title}" style="width:100%; height:100%; object-fit:cover;">
                                    <div class="course-tag ${status}" style="position:absolute; top:12px; right:12px; background:${status === 'active' ? 'var(--amber)' : 'rgba(255,255,255,0.1)'}; color:${status === 'active' ? 'black' : 'white'}; font-weight:700; font-size:0.7rem; padding:4px 10px; border-radius:100px;">${status.toUpperCase()}</div>
                                </div>
                                <div class="course-content" style="padding:1.5rem;">
                                    <h3 class="course-title" style="font-size:1.1rem; color:white; margin-bottom:1rem;">${c.title}</h3>
                                    <div class="course-meta" style="display:flex; flex-direction:column; gap:8px; margin-bottom:1.5rem;">
                                        <span style="font-size:0.82rem; color:rgba(255,255,255,0.6); display:flex; align-items:center; gap:8px;">
                                            <i class="fas fa-calendar-check" style="color:var(--amber);"></i> ${c.startTime || 'Ongoing'}
                                        </span>
                                    </div>
                                    <button onclick="openClassroom('${enrollData.courseId || enrollData.course}', '${status}')" class="btn ${status === 'active' ? 'btn-primary' : 'btn-ghost'} btn-block" style="border-radius:10px; font-weight:700; letter-spacing:0.05em; ${status !== 'active' ? 'opacity:0.6;' : ''}">
                                        <i class="fas ${status === 'active' ? 'fa-door-open' : 'fa-lock'}"></i> ${status === 'active' ? 'ACCESS CLASSROOM' : 'PENDING VERIFICATION'}
                                    </button>
                                </div>
                            </div>
                        `;
                    }
                    coursesContainer.innerHTML = html;
                }
            }
            fetchAndRenderCourses(); 
        } catch (err) { 
            console.error('Dashboard data error:', err); 
            if (coursesContainer) coursesContainer.innerHTML = '<p style="color:#f87171; text-align:center; grid-column:1/-1;">Error loading your programs. Please refresh.</p>';
        }
    }

    function initDashboardNav() {
        const sidebarLinks = document.querySelectorAll('.sidebar-nav a[data-section]');
        const sections     = document.querySelectorAll('.dash-section');
        const sidebar      = document.getElementById('mainSidebar');
        const sidebarMask  = document.getElementById('sidebarMask');
        const toggleBtn    = document.getElementById('sidebarToggle');

        sidebarLinks.forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                const target = link.dataset.section;

                // Toggle active classes
                sidebarLinks.forEach(l => l.parentElement.classList.toggle('active', l === link));
                sections.forEach(s => s.classList.toggle('active', s.id === (target + '-section')));

                // Close mobile sidebar
                sidebar?.classList.remove('active');
                sidebarMask?.classList.remove('active');
            });
        });

        // Mobile Toggle
        toggleBtn?.addEventListener('click', () => {
            sidebar?.classList.add('active');
            sidebarMask?.classList.add('active');
        });

        sidebarMask?.addEventListener('click', () => {
            sidebar?.classList.remove('active');
            sidebarMask?.classList.remove('active');
        });
    }

    // ============================================================
    //  ADMIN CONSOLE LOGIC (admin.html)
    // ============================================================
    // ============================================================
    //  ADMIN CONSOLE LOGIC (admin.html)
    // ============================================================
    let currentAdminFilter = 'all';
    let enrollmentsData = [];

    async function loadAdminData() {
        const tableBody = document.getElementById('studentsTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '<tr><td colspan="11" class="adm-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';

        try {
            const snap = await db.collection('enrollments').orderBy('submittedAt', 'desc').get();
            enrollmentsData = [];
            snap.forEach(doc => enrollmentsData.push({ id: doc.id, ...doc.data() }));

            renderAdminTable();
            updateAdminStats();
        } catch (err) {
            console.error('Admin Load Error:', err);
            tableBody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding:3rem; color:#f87171;">Access Denied or Database Error</td></tr>';
        }
    }

    function renderAdminTable() {
        const tableBody = document.getElementById('studentsTableBody');
        const countEl   = document.getElementById('tableCount');
        if (!tableBody) return;

        const filtered = enrollmentsData.filter(item => {
            if (currentAdminFilter === 'all') return true;
            if (currentAdminFilter === 'pending') return item.status === 'form_submitted' || item.status === 'payment_confirmed';
            return item.status === currentAdminFilter;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="11" class="adm-empty"><i class="fas fa-folder-open"></i><p>No records found matching this filter.</p></td></tr>';
            if (countEl) countEl.textContent = '0 records found';
            return;
        }

        tableBody.innerHTML = filtered.map((item, i) => {
            const isPending = item.status === 'form_submitted' || item.status === 'payment_confirmed';
            const statusClass = isPending ? 'pending' : (item.status === 'active' ? 'active' : 'new');
            const dateStr = item.submittedAt?.toDate().toLocaleDateString('en-PK', { day:'numeric', month:'short' }) || '—';
            
            return `
                <tr>
                    <td>${i + 1}</td>
                    <td class="td-name">${sanitize(item.fullName)}</td>
                    <td class="td-email">${sanitize(item.email)}</td>
                    <td>${sanitize(item.whatsapp || item.phone)}</td>
                    <td style="font-size:0.75rem;">${sanitize(item.courseName || item.course)}</td>
                    <td>${sanitize(item.city || '—')}</td>
                    <td><span style="font-size:0.7rem; font-weight:600;">${sanitize(item.paymentMethod || '—')}</span></td>
                    <td>
                        ${item.receiptUrl ? `<a href="${item.receiptUrl}" target="_blank" style="color:var(--amber); font-size:1.1rem;"><i class="fas fa-file-invoice"></i></a>` : '<span style="opacity:0.2;">—</span>'}
                    </td>
                    <td><span class="s-badge ${statusClass}">${item.status.replace('_',' ')}</span></td>
                    <td>${dateStr}</td>
                    <td>
                        <div style="display:flex; gap:6px;">
                            ${isPending ? `<button onclick="handleEnrollmentAction('${item.id}', 'active')" class="adm-btn adm-btn-sm adm-btn-approve" title="Approve"><i class="fas fa-check"></i></button>` : ''}
                            ${isPending ? `<button onclick="handleEnrollmentAction('${item.id}', 'rejected')" class="adm-btn adm-btn-sm adm-btn-reject" title="Reject"><i class="fas fa-times"></i></button>` : ''}
                            <button onclick="viewEnrollmentDetail('${item.id}')" class="adm-btn adm-btn-sm adm-btn-ghost" title="View Detail"><i class="fas fa-eye"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        if (countEl) countEl.textContent = `${filtered.length} records found`;
        setText('lastUpdated', 'Last updated: ' + new Date().toLocaleTimeString());
    }

    function updateAdminStats() {
        setText('statTotal', enrollmentsData.length);
        setText('statPending', enrollmentsData.filter(d => d.status === 'form_submitted' || d.status === 'payment_confirmed').length);
        setText('statActive', enrollmentsData.filter(d => d.status === 'active').length);
        
        // Find top course
        const counts = {};
        enrollmentsData.forEach(d => { const c = d.courseName || d.course; counts[c] = (counts[c] || 0) + 1; });
        const top = Object.entries(counts).sort((a,b) => b[1] - a[1])[0];
        setText('statTopCourse', top ? top[0] : '—');
    }

    window.handleEnrollmentAction = async (id, newStatus) => {
        if (!confirm(`Are you sure you want to ${newStatus} this enrollment?`)) return;
        
        try {
            const updateObj = { status: newStatus, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
            if (newStatus === 'active') {
                updateObj.paymentStatus = 'verified';
                updateObj.verifiedAt = firebase.firestore.FieldValue.serverTimestamp();
                // Optionally generate Roll Number here
                const enrollment = enrollmentsData.find(e => e.id === id);
                if (enrollment && !enrollment.rollNumber) {
                    updateObj.rollNumber = 'ZCP-' + (2026) + '-' + (Math.floor(100+Math.random()*900));
                }
            }

            await db.collection('enrollments').doc(id).update(updateObj);
            showToast(`Enrollment ${newStatus} successfully!`, 'success');
            loadAdminData(); // Refresh
        } catch (err) {
            console.error('Action error:', err);
            showToast('Failed to update status', 'error');
        }
    };

    window.setFilter = (filter, btn) => {
        currentAdminFilter = filter;
        document.querySelectorAll('.adm-filter-pill').forEach(b => b.classList.toggle('active', b === btn));
        renderAdminTable();
    };

    window.switchView = (view, btn) => {
        document.querySelectorAll('.adm-nav-item').forEach(b => b.classList.toggle('active', b === btn));
        const studentsView = document.querySelector('.adm-stats, .adm-table-section'); // Simplified check
        const coursesView = document.getElementById('courseManagementSection');
        const viewTitle = document.getElementById('viewTitle');

        if (view === 'courses') {
            if (coursesView) coursesView.style.display = 'block';
            document.querySelector('.adm-stats').style.display = 'none';
            document.querySelector('.adm-table-section').style.display = 'none';
            if (viewTitle) viewTitle.textContent = 'Course Management';
            document.getElementById('launchBatchBtn').style.display = 'flex';
            document.getElementById('refreshBtn').style.display = 'none';
            document.getElementById('exportBtn').style.display = 'none';
            loadAdminCourses();
        } else {
            if (coursesView) coursesView.style.display = 'none';
            if (document.querySelector('.adm-stats')) document.querySelector('.adm-stats').style.display = 'grid';
            if (document.querySelector('.adm-table-section')) document.querySelector('.adm-table-section').style.display = 'block';
            if (viewTitle) viewTitle.textContent = view.charAt(0).toUpperCase() + view.slice(1) + ' Enrollments';
            if (document.getElementById('launchBatchBtn')) document.getElementById('launchBatchBtn').style.display = 'none';
            if (document.getElementById('refreshBtn')) document.getElementById('refreshBtn').style.display = 'flex';
            if (document.getElementById('exportBtn')) document.getElementById('exportBtn').style.display = 'flex';
            currentAdminFilter = view === 'students' ? 'all' : view;
            loadAdminData();
        }
    };

    window.viewEnrollmentDetail = (id) => {
        const item = enrollmentsData.find(e => e.id === id);
        if (!item) return;

        const modal = document.getElementById('detailModal');
        const nameEl = document.getElementById('modalName');
        const gridEl = document.getElementById('modalGrid');
        
        if (modal) {
            if (nameEl) nameEl.textContent = item.fullName;
            if (gridEl) {
                gridEl.innerHTML = `
                    <div class="adm-detail-field">
                        <div class="adm-detail-label">Email Address</div>
                        <div class="adm-detail-value">${item.email}</div>
                    </div>
                    <div class="adm-detail-field">
                        <div class="adm-detail-label">WhatsApp</div>
                        <div class="adm-detail-value">${item.whatsapp || item.phone}</div>
                    </div>
                    <div class="adm-detail-field">
                        <div class="adm-detail-label">Course</div>
                        <div class="adm-detail-value">${item.courseName || item.course}</div>
                    </div>
                    <div class="adm-detail-field">
                        <div class="adm-detail-label">City</div>
                        <div class="adm-detail-value">${item.city || '—'}</div>
                    </div>
                    <div class="adm-detail-field">
                        <div class="adm-detail-label">Payment Method</div>
                        <div class="adm-detail-value">${item.paymentMethod || '—'}</div>
                    </div>
                    <div class="adm-detail-field">
                        <div class="adm-detail-label">Submitted At</div>
                        <div class="adm-detail-value">${item.submittedAt?.toDate().toLocaleString() || '—'}</div>
                    </div>
                    ${item.receiptUrl ? `
                    <div class="adm-detail-field full">
                        <div class="adm-detail-label">Payment Receipt</div>
                        <div style="margin-top:10px; border:1px solid var(--border); border-radius:12px; overflow:hidden;">
                            <img src="${item.receiptUrl}" style="width:100%; max-height:400px; object-fit:contain; background:#000;">
                        </div>
                    </div>` : ''}
                `;
            }
            modal.classList.add('active');
        }
    };

    window.closeModal = () => document.getElementById('detailModal').classList.remove('active');

    // Course Management
    async function loadAdminCourses() {
        const grid = document.getElementById('coursesCardsGrid');
        if (!grid) return;
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';

        try {
            const snap = await db.collection('courses').get();
            let html = '';
            snap.forEach(doc => {
                const c = doc.data();
                html += `
                    <div class="course-card glass-card" style="padding:0; overflow:hidden; border:1px solid rgba(255,255,255,0.05);">
                        <div style="height:120px; position:relative;">
                            <img src="${c.imageUrl || 'assets/course-placeholder.png'}" style="width:100%; height:100%; object-fit:cover; opacity:0.6;">
                            <div style="position:absolute; top:12px; right:12px; background:var(--amber); color:black; font-size:0.65rem; font-weight:700; padding:3px 8px; border-radius:4px;">${c.status.toUpperCase()}</div>
                        </div>
                        <div style="padding:1.25rem;">
                            <h3 style="font-size:1rem; color:white; margin-bottom:8px;">${sanitize(c.title)}</h3>
                            <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:1.5rem;">
                                <div><i class="fas fa-tag"></i> Rs ${c.price}</div>
                                <div><i class="fas fa-calendar"></i> ${sanitize(c.startTime)}</div>
                            </div>
                            <div style="display:flex; gap:8px;">
                                <button onclick="editCourse('${doc.id}')" class="adm-btn adm-btn-sm adm-btn-ghost" style="flex:1;"><i class="fas fa-edit"></i> Edit</button>
                                <button onclick="deleteCourse('${doc.id}')" class="adm-btn adm-btn-sm adm-btn-reject" style="flex:0;"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    </div>
                `;
            });
            grid.innerHTML = html || '<p style="grid-column:1/-1; text-align:center; padding:3rem;">No courses found.</p>';
        } catch (err) { console.error(err); }
    }

    window.openCourseModal = () => {
        document.getElementById('courseForm').reset();
        document.getElementById('courseEditId').value = '';
        document.getElementById('courseModalTitle').textContent = 'Launch New Batch';
        document.getElementById('courseModal').classList.add('active');
    };

    window.previewCourseImage = (input) => {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => updateImagePreview(e.target.result);
            reader.readAsDataURL(input.files[0]);
        }
    };

    async function uploadCourseImage(file) {
        if (!file) return null;
        const progressContainer = document.getElementById('uploadProgressContainer');
        const progressBar = document.getElementById('uploadProgressBar');
        const statusText = document.getElementById('uploadStatusText');
        
        progressContainer.style.display = 'block';
        const storageRef = firebase.storage().ref(`course_banners/${Date.now()}_${file.name}`);
        const uploadTask = storageRef.put(file);

        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed', 
                (snap) => {
                    const progress = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                    progressBar.style.width = progress + '%';
                    statusText.textContent = `Uploading... ${progress}%`;
                },
                (err) => {
                    console.error('Upload error:', err);
                    showToast('Image upload failed', 'error');
                    reject(err);
                },
                async () => {
                    const url = await uploadTask.snapshot.ref.getDownloadURL();
                    progressBar.style.width = '100%';
                    statusText.textContent = 'Upload complete!';
                    setTimeout(() => progressContainer.style.display = 'none', 1000);
                    resolve(url);
                }
            );
        });
    }

    window.closeCourseModal = () => document.getElementById('courseModal').classList.remove('active');

    window.handleCourseSubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('courseEditId').value;
        const submitBtn = document.getElementById('courseSubmitBtn');
        const originalBtnHtml = submitBtn.innerHTML;
        
        const fileInput = document.getElementById('cImageFile');
        let imageUrl = document.getElementById('cImage').value;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        try {
            // Upload new image if selected
            if (fileInput.files.length > 0) {
                const uploadedUrl = await uploadCourseImage(fileInput.files[0]);
                if (uploadedUrl) imageUrl = uploadedUrl;
            }

            if (!imageUrl) {
                showToast('Please select a banner image', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHtml;
                return;
            }

            const data = {
                title: document.getElementById('cTitle').value,
                imageUrl: imageUrl,
                zoomLink: document.getElementById('cZoomLink').value || '',
                startTime: document.getElementById('cStart').value,
                timing: document.getElementById('cTiming').value,
                price: document.getElementById('cPrice').value,
                status: 'live',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (id) await db.collection('courses').doc(id).update(data);
            else {
                data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection('courses').add(data);
            }
            showToast('Course saved successfully!', 'success');
            closeCourseModal();
            if (window.loadAdminCourses) window.loadAdminCourses();
            else location.reload(); // Fallback if admin.html logic is separate
        } catch (err) { 
            console.error(err);
            showToast('Error saving course', 'error'); 
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
        }
    };

    window.editCourse = async (id) => {
        try {
            const doc = await db.collection('courses').doc(id).get();
            const c = doc.data();
            document.getElementById('courseEditId').value = id;
            document.getElementById('cTitle').value = c.title || '';
            document.getElementById('cImage').value = c.imageUrl || '';
            document.getElementById('cZoomLink').value = c.zoomLink || '';
            document.getElementById('cStart').value = c.startTime || '';
            document.getElementById('cTiming').value = c.timing || '';
            document.getElementById('cPrice').value = c.price || '';
            
            if (window.updateImagePreview) window.updateImagePreview(c.imageUrl || '');
            
            document.getElementById('courseModalTitle').textContent = 'Edit Course';
            document.getElementById('courseModal').classList.add('active');
        } catch (err) { console.error(err); }
    };

    window.deleteCourse = async (id) => {
        if (!confirm('Permanently delete this course?')) return;
        try {
            await db.collection('courses').doc(id).delete();
            showToast('Course removed', 'success');
            loadAdminCourses();
        } catch (err) { showToast('Error deleting', 'error'); }
    };

    // Global UI Helpers
    window.showToast = (msg, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `adm-toast show ${type}`;
        toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${msg}`;
        document.body.appendChild(toast);
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 500); }, 3000);
    };

    // Helpers
    function setText(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    // ============================================================
    //  CLASSROOM LOGIC (dashboard.html)
    // ============================================================
    window.openClassroom = async function(courseId, status) {
        if (status !== 'active' && status !== 'payment_confirmed') {
            alert('Access Denied: Your enrollment is still pending verification. Please wait for the admin to approve your payment.');
            return;
        }
        
        const modal = document.getElementById('classroomModal');
        const list = document.getElementById('classroomContentList');
        const titleEl = document.getElementById('classroomTitle');
        
        if (modal) modal.classList.add('active');
        if (list) list.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x"></i><p style="margin-top:1rem;">Entering Classroom...</p></div>';

        try {
            // Fetch course details
            const cDoc = await db.collection('courses').doc(courseId).get();
            const courseData = cDoc.data() || {};
            if (cDoc.exists && titleEl) titleEl.textContent = courseData.title;

            // Live Session Hub logic
            const liveHub = document.getElementById('liveSessionHub');
            const liveTiming = document.getElementById('liveClassTiming');
            const joinBtn = document.getElementById('zoomJoinBtn');

            if (liveHub) {
                if (courseData.zoomLink && courseData.zoomLink.trim() !== '') {
                    liveHub.style.display = 'block';
                    if (liveTiming) liveTiming.textContent = courseData.timing || 'Check schedule';
                    if (joinBtn) joinBtn.href = courseData.zoomLink;
                } else {
                    liveHub.style.display = 'none';
                }
            }

            // Fetch materials
            const snap = await db.collection('courses').doc(courseId).collection('content').orderBy('createdAt', 'desc').get();
            
            if (snap.empty) {
                list.innerHTML = `
                    <div style="grid-column:1/-1; text-align:center; padding:4rem; opacity:0.3;">
                        <i class="fas fa-layer-group fa-3x" style="margin-bottom:1rem;"></i>
                        <p>Your instructor hasn't posted any materials yet.</p>
                    </div>`;
            } else {
                let html = '';
                const icons = { link: 'fa-link', lecture: 'fa-video', zoom: 'fa-broadcast-tower', pdf: 'fa-file-pdf' };
                const labels = { link: 'Link', lecture: 'Lecture', zoom: 'Live Class', pdf: 'Document' };

                snap.forEach(doc => {
                    const item = doc.data();
                    html += `
                        <a href="${item.url}" target="_blank" class="classroom-card glass-card" style="padding:1.5rem; text-decoration:none; display:flex; flex-direction:column; gap:12px; transition: 0.2s; border:1px solid rgba(255,255,255,0.05);">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                <div style="background:var(--amber-dim); color:var(--amber); width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">
                                    <i class="fas ${icons[item.type] || 'fa-file'}"></i>
                                </div>
                                <span style="font-size:0.65rem; font-weight:700; color:rgba(255,255,255,0.4); text-transform:uppercase;">${labels[item.type] || 'Material'}</span>
                            </div>
                            <div>
                                <div style="font-size:1rem; font-weight:700; color:white; margin-bottom:4px; line-height:1.4;">${item.title}</div>
                                <div style="font-size:0.75rem; color:rgba(255,255,255,0.5); line-height:1.5;">${item.description || 'Click to access material'}</div>
                            </div>
                            <div style="margin-top:auto; padding-top:1rem; color:var(--amber); font-size:0.75rem; font-weight:700; display:flex; align-items:center; gap:6px;">
                                GO TO CONTENT <i class="fas fa-arrow-right"></i>
                            </div>
                        </a>
                    `;
                });
                list.innerHTML = html;
            }
        } catch(err) {
            console.error(err);
            if (list) list.innerHTML = '<p style="color:#f87171; text-align:center;">Error loading materials.</p>';
        }
    }

    window.closeClassroom = function() {
        const modal = document.getElementById('classroomModal');
        if (modal) modal.classList.remove('active');
    }

    // ============================================================
    //  DIGITAL ID CARD LOGIC (dashboard.html)
    // ============================================================
    window.openIDCard = async function() {
        const modal = document.getElementById('idCardModal');
        const cardName = document.getElementById('cardName');
        const cardRoll = document.getElementById('cardRoll');
        
        // Populate with current user data
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        try {
            const doc = await db.collection('students').doc(currentUser.uid).get();
            if (doc.exists) {
                const data = doc.data();
                if (cardName) cardName.textContent = data.fullName;
                if (cardRoll) cardRoll.textContent = data.rollNumber || 'ZCP-2026-PENDING';
            }
            if (modal) modal.classList.add('active');
        } catch (err) {
            console.error('Error opening ID card:', err);
        }
    }

    window.closeIDCard = function() {
        const modal = document.getElementById('idCardModal');
        if (modal) modal.classList.remove('active');
    }

    window.downloadIDCard = function() {
        const card = document.getElementById('zcpIDCard');
        if (!card) return;

        const btn = event.currentTarget;
        const originalContent = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> GENERATING...';

        html2canvas(card, {
            scale: 3, // High quality
            backgroundColor: null,
            logging: false,
            useCORS: true
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `ZCP_ID_${document.getElementById('cardName').textContent.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }).catch(err => {
            console.error('Download error:', err);
            btn.disabled = false;
            btn.innerHTML = originalContent;
        });
    }

    // ============================================================
    //  CONFETTI EFFECT
    // ============================================================
    window.triggerConfetti = function() {
        let canvas = document.getElementById('confetti-canvas');
        if (!canvas) {
            // Check for auth page success canvas too
            const authCanvas = document.getElementById('confetti-canvas-auth');
            if (authCanvas) { canvas = authCanvas; } 
            else {
                // Create canvas if not exists
                const modal = document.querySelector('.enroll-modal.active') || document.querySelector('.adm-modal.active') || document.getElementById('registrationSuccess');
                if (!modal) return;
                const newCanvas = document.createElement('canvas');
                newCanvas.id = 'confetti-canvas';
                newCanvas.style = 'position:absolute; inset:0; pointer-events:none; z-index:10;';
                modal.style.position = 'relative';
                modal.appendChild(newCanvas);
                return window.triggerConfetti();
            }
        }
        const ctx = canvas.getContext('2d');
        const parent = canvas.parentElement;
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;

        let pieces = [];
        const colors = ['#f59e0b', '#fbbf24', '#ffffff', '#6366f1'];

        for (let i = 0; i < 80; i++) {
            pieces.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                rotation: Math.random() * 360,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 8 + 4,
                gravity: Math.random() * 2 + 1,
                rotationSpeed: Math.random() * 10 - 5
            });
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            pieces.forEach(p => {
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation * Math.PI / 180); ctx.fillStyle = p.color;
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size); ctx.restore();
                p.y += p.gravity; p.rotation += p.rotationSpeed;
            });
            if (pieces.some(p => p.y < canvas.height)) requestAnimationFrame(draw);
            else canvas.remove();
        }
        draw();
    };

    // ============================================================
    //  DASHBOARD SIDEBAR TOGGLE
    // ============================================================
    const sideToggle = document.getElementById('sidebarToggle');
    const mainSidebar = document.getElementById('mainSidebar');
    const sideMask    = document.getElementById('sidebarMask');

    if (sideToggle && mainSidebar && sideMask) {
        sideToggle.addEventListener('click', () => {
            mainSidebar.classList.toggle('active');
            sideMask.classList.toggle('active');
        });

        sideMask.addEventListener('click', () => {
            mainSidebar.classList.remove('active');
            sideMask.classList.remove('active');
        });

        // Close on nav click (mobile)
        mainSidebar.querySelectorAll('.nav-item a').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 1024) {
                    mainSidebar.classList.remove('active');
                    sideMask.classList.remove('active');
                }
            });
        });
    }
});

