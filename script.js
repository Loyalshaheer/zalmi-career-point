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
    const auth = firebase.auth();
    const db   = firebase.firestore();

    // Admin emails — full access to Admin Console
    const ADMIN_EMAILS = [
        'loyalshaheer05@gmail.com',
        'khan@gmail.com',
        'shaheer@zalmicareer.com',
        'admin@zalmicareer.com'
    ];

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
            mobileBtn.querySelector('i').classList.toggle('fa-bars');
            mobileBtn.querySelector('i').classList.toggle('fa-times');
        });
    }

    // ============================================================
    //  ENROLLMENT FORM & PAYMENT (Landing Page)
    // ============================================================
    const enrollForm     = document.getElementById('enrollmentForm');
    const paymentStep    = document.getElementById('paymentStep');
    const formSuccess    = document.getElementById('formSuccess');
    const confirmPayBtn  = document.getElementById('confirmPayment');

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
                    status:         'form_submitted',
                    paymentStatus:  'pending',
                    submittedAt:    firebase.firestore.FieldValue.serverTimestamp(),
                    uid:            auth.currentUser ? auth.currentUser.uid : null
                });

                localStorage.setItem('pendingEnrollmentId', docRef.id);
                localStorage.setItem('pendingEnrollment',   JSON.stringify(data));

                enrollForm.style.display = 'none';
                if (paymentStep) paymentStep.style.display = 'block';

                const modal = document.querySelector('.pd-modal, .enrollment-card');
                if (modal) modal.scrollTo({ top: 0, behavior: 'smooth' });

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
            const docId  = localStorage.getItem('pendingEnrollmentId');
            const method = document.querySelector('.pd-method-card.active, .payment-method-card.active')?.dataset.method || 'unknown';

            if (!docId) { alert('Session expired. Please fill the form again.'); return; }

            confirmPayBtn.disabled = true;
            const origHtml = confirmPayBtn.innerHTML;
            confirmPayBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Confirming...';

            try {
                await db.collection('enrollments').doc(docId).update({
                    paymentMethod:  method,
                    status:         'payment_confirmed',
                    paymentStatus:  'pending_verification',
                    confirmedAt:    firebase.firestore.FieldValue.serverTimestamp()
                });

                localStorage.removeItem('pendingEnrollmentId');
                localStorage.removeItem('pendingEnrollment');

                if (paymentStep) paymentStep.style.display = 'none';
                if (formSuccess) formSuccess.style.display = 'block';

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

            if (!email || !password) return;

            submitBtn.disabled = true;

            try {
                if (isLogin) {
                    await auth.signInWithEmailAndPassword(email, password);
                    window.location.href = 'dashboard.html';
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
                    window.location.href = 'dashboard.html';
                }
            } catch (err) {
                if (authErrorMsg) { authErrorMsg.textContent = err.message; authErrorMsg.style.display = 'block'; }
                submitBtn.disabled = false;
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

            // Load Courses Preview
            const coursesContainer = document.getElementById('coursesContainer');
            if (coursesContainer) {
                coursesContainer.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:3rem; opacity:0.5;"><i class="fas fa-box-open fa-2x"></i><p>No active courses found.</p></div>';
            }
        } catch (err) { console.error('Dashboard data error:', err); }
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
    async function loadAdminData() {
        try {
            const snap = await db.collection('enrollments').orderBy('submittedAt', 'desc').get();
            const tableBody = document.getElementById('studentsTableBody');
            const totalEl    = document.getElementById('adminTotalStudents');
            
            if (totalEl) totalEl.textContent = snap.size;

            let pending = 0;
            let active  = 0;
            let rowsHtml = '';

            snap.forEach((doc, i) => {
                const item = doc.data();
                const isPending = item.status === 'form_submitted' || item.status.includes('pending');
                if (isPending) pending++; else active++;

                rowsHtml += `
                    <tr>
                        <td>${i + 1}</td>
                        <td style="font-weight:600;">${item.fullName}</td>
                        <td>${item.email}</td>
                        <td>${item.course}</td>
                        <td>
                            <span class="status-pill ${isPending ? 'pending' : 'active'}">
                                ${isPending ? 'Pending' : 'Active'}
                            </span>
                        </td>
                        <td>${item.submittedAt?.toDate().toLocaleDateString() || 'N/A'}</td>
                    </tr>
                `;
            });

            if (tableBody) tableBody.innerHTML = rowsHtml;
            setText('adminPending', pending);
            setText('adminActive', active);

        } catch (err) { console.error('Admin Load Error:', err); }
    }

    // Helpers
    function setText(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

});
