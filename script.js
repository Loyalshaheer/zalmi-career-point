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
        'loyalshaheer05@gmail.com', // PRIMARY ADMIN — Shaheer
        'khan@gmail.com',
        'shaheer@zalmicareer.com',
        'admin@zalmicareer.com'
    ];

    // ============================================================
    //  SCROLL REVEAL
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
    //  MOBILE MENU
    // ============================================================
    const menuBtn  = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.pd-nav-links, .nav-links');
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = menuBtn.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
    }

    // ============================================================
    //  COURSE AVAILABILITY
    // ============================================================
    const courseAvailability = {
        'content-creation': { available: true,  message: 'Live Batch - Active' },
        'web-app':           { available: false, message: 'Coming soon — stay tuned!' },
        'earning-strategies':{ available: false, message: 'Enrollment currently locked for this advanced program.' }
    };

    const courseSelect     = document.getElementById('course');
    const courseStatusMsg  = document.getElementById('courseStatusMsg');
    const courseStatusText = document.getElementById('courseStatusText');
    const enrollSubmitBtn  = document.querySelector('#enrollmentForm button[type="submit"]');

    function checkCourseAvailability(id) {
        const s = courseAvailability[id];
        if (!s) return;
        if (courseStatusMsg) courseStatusMsg.style.display = s.available ? 'none' : 'block';
        if (courseStatusText && !s.available) courseStatusText.textContent = s.message;
        if (enrollSubmitBtn) {
            enrollSubmitBtn.disabled = !s.available;
            enrollSubmitBtn.style.opacity = s.available ? '1' : '0.5';
        }
    }

    if (courseSelect) {
        courseSelect.addEventListener('change', e => checkCourseAvailability(e.target.value));
    }

    // ============================================================
    //  ENROLLMENT MODAL  (index.html)
    // ============================================================
    const enrollModal   = document.getElementById('enrollModal');
    const modalClose    = document.querySelector('.modal-close, .pd-modal-close');
    const enrollForm    = document.getElementById('enrollmentForm');
    const paymentStep   = document.getElementById('paymentStep');
    const formSuccess   = document.getElementById('formSuccess');
    const confirmPayBtn = document.getElementById('confirmPaymentBtn');

    function openModal() {
        if (!enrollModal) return;
        enrollModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Pre-fill email if logged in
        const user = auth.currentUser;
        if (user) {
            const emailInput = document.getElementById('email');
            if (emailInput) emailInput.value = user.email;
        }
    }

    function closeModal() {
        if (!enrollModal) return;
        enrollModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Open on all enroll buttons
    document.querySelectorAll('a[href="#enroll"]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            // Auto-select course if clicked from a course card
            const card = btn.closest('[data-course]');
            if (card && courseSelect) {
                courseSelect.value = card.dataset.course;
                checkCourseAvailability(courseSelect.value);
            }
            openModal();
        });
    });

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (enrollModal) {
        enrollModal.addEventListener('click', e => {
            if (e.target === enrollModal) closeModal();
        });
    }

    // ── Payment method cards ──
    const paymentData = {
        easypaisa: { title: 'Loyal Shaheer',                           number: '0333 4747734' },
        jazzcash:  { title: 'Shaheer Ahmed',                           number: '0333 4747734' },
        bank:      { title: 'Shaheer Growth Hub (Meezan Bank)',        number: '1234 5678 9012 3456' }
    };

    document.querySelectorAll('.pd-method-card, .payment-method-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.pd-method-card, .payment-method-card')
                    .forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            const method = card.dataset.method;
            if (paymentData[method]) {
                const t = document.getElementById('accountTitle');
                const n = document.getElementById('accountNumber');
                if (t) t.textContent = paymentData[method].title;
                if (n) n.textContent = paymentData[method].number;
            }
        });
    });

    // ── Step 1: Form submit — save to Firestore immediately ──
    if (enrollForm) {
        enrollForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData  = new FormData(this);
            const data      = Object.fromEntries(formData.entries());
            const submitBtn = this.querySelector('button[type="submit"]');
            const btnText   = submitBtn.querySelector('.btn-text') || submitBtn;
            const origText  = btnText.textContent;

            submitBtn.disabled = true;
            btnText.textContent = 'Saving…';

            try {
                // Save preliminary enrollment to Firestore (no login required)
                const docRef = await db.collection('enrollments').add({
                    ...data,
                    status:         'form_submitted',
                    paymentStatus:  'pending',
                    submittedAt:    firebase.firestore.FieldValue.serverTimestamp(),
                    uid:            auth.currentUser ? auth.currentUser.uid : null
                });

                // Store reference for payment step
                localStorage.setItem('pendingEnrollmentId', docRef.id);
                localStorage.setItem('pendingEnrollment',   JSON.stringify(data));

                // Move to payment step
                enrollForm.style.display = 'none';
                if (paymentStep) paymentStep.style.display = 'block';

                // Scroll modal to top
                const modal = document.querySelector('.pd-modal, .enrollment-card');
                if (modal) modal.scrollTo({ top: 0, behavior: 'smooth' });

            } catch (err) {
                console.error('Enrollment save error:', err);
                showError(`Could not save your enrollment: ${err.message}`);
                submitBtn.disabled = false;
                btnText.textContent = origText;
            }
        });
    }

    // ── Step 2: Confirm payment ──
    if (confirmPayBtn) {
        confirmPayBtn.addEventListener('click', async () => {
            const docId  = localStorage.getItem('pendingEnrollmentId');
            const method = document.querySelector('.pd-method-card.active, .payment-method-card.active')
                               ?.dataset.method || 'unknown';

            if (!docId) {
                showError('Session expired. Please fill the form again.');
                return;
            }

            confirmPayBtn.disabled = true;
            const origHtml = confirmPayBtn.innerHTML;
            confirmPayBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Confirming…';

            try {
                // Update enrollment with payment info
                await db.collection('enrollments').doc(docId).update({
                    paymentMethod:  method,
                    status:         'payment_confirmed',
                    paymentStatus:  'pending_verification',
                    confirmedAt:    firebase.firestore.FieldValue.serverTimestamp()
                });

                // Also link to student profile if logged in
                const user = auth.currentUser;
                if (user) {
                    await db.collection('students').doc(user.uid).set({
                        hasPendingEnrollment:   true,
                        lastEnrollmentAt:       firebase.firestore.FieldValue.serverTimestamp(),
                        lastEnrollmentDocId:    docId
                    }, { merge: true });
                }

                localStorage.removeItem('pendingEnrollmentId');
                localStorage.removeItem('pendingEnrollment');

                if (paymentStep) paymentStep.style.display = 'none';
                if (formSuccess) formSuccess.style.display = 'block';

            } catch (err) {
                console.error('Payment confirm error:', err);
                showError(`Error: ${err.message}`);
                confirmPayBtn.disabled = false;
                confirmPayBtn.innerHTML = origHtml;
            }
        });
    }

    function showError(msg) {
        const el = document.getElementById('errorMsg');
        if (el) { el.textContent = msg; el.style.display = 'block'; }
        else alert(msg);
    }

    // ============================================================
    //  LOGIN / REGISTER PAGE  (login.html)
    // ============================================================
    const loginForm      = document.getElementById('loginForm');
    const toggleAuth     = document.getElementById('toggleAuth');
    const authTitle      = document.getElementById('authTitle');
    const authSubtitle   = document.getElementById('authSubtitle');
    const registerFields = document.getElementById('registerFields');
    const errorMsg       = document.getElementById('errorMsg');

    let isLogin = true;

    function setAuthError(msg) {
        if (errorMsg) {
            errorMsg.textContent = msg;
            errorMsg.style.display = msg ? 'block' : 'none';
        }
    }

    if (toggleAuth) {
        toggleAuth.addEventListener('click', e => {
            e.preventDefault();
            isLogin = !isLogin;
            setAuthError('');

            if (isLogin) {
                if (authTitle)    authTitle.textContent      = 'Welcome back';
                if (authSubtitle) authSubtitle.textContent   = 'Sign in to access your student dashboard.';
                if (registerFields) registerFields.style.display = 'none';
                toggleAuth.textContent = 'Create account';
                const btn = loginForm?.querySelector('.auth-submit-btn .btn-text, .auth-submit-btn');
                if (btn) btn.textContent = 'Sign In to Dashboard';
            } else {
                if (authTitle)    authTitle.textContent      = 'Create account';
                if (authSubtitle) authSubtitle.textContent   = 'Join Zalmi Career Point today.';
                if (registerFields) registerFields.style.display = 'block';
                toggleAuth.textContent = 'Sign in instead';
                const btn = loginForm?.querySelector('.auth-submit-btn .btn-text, .auth-submit-btn');
                if (btn) btn.textContent = 'Create Account';
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async e => {
            e.preventDefault();
            setAuthError('');

            const email    = document.getElementById('loginEmail')?.value?.trim();
            const password = document.getElementById('loginPassword')?.value;
            const submitBtn = loginForm.querySelector('.auth-submit-btn');
            const btnSpan   = submitBtn?.querySelector('.btn-text') || submitBtn;
            const origText  = btnSpan?.textContent;

            if (submitBtn) submitBtn.disabled = true;
            if (btnSpan)   btnSpan.textContent = 'Please wait…';

            try {
                if (isLogin) {
                    await auth.signInWithEmailAndPassword(email, password);
                    window.location.href = 'dashboard.html';
                } else {
                    const fullName = document.getElementById('regFullName')?.value?.trim();
                    const phone    = document.getElementById('regPhone')?.value?.trim();

                    if (!fullName || !phone) {
                        setAuthError('Please fill in all fields.');
                        if (submitBtn) submitBtn.disabled = false;
                        if (btnSpan)   btnSpan.textContent = origText;
                        return;
                    }

                    const cred = await auth.createUserWithEmailAndPassword(email, password);

                    // Create Firestore student profile
                    await db.collection('students').doc(cred.user.uid).set({
                        fullName:   fullName,
                        phone:      phone,
                        email:      email,
                        rollNumber: 'ZCP-' + Math.floor(1000 + Math.random() * 9000),
                        status:     'New Member',
                        createdAt:  firebase.firestore.FieldValue.serverTimestamp()
                    });

                    window.location.href = 'dashboard.html';
                }
            } catch (err) {
                console.error('Auth error:', err);
                const msgs = {
                    'auth/user-not-found':      'No account found with this email.',
                    'auth/wrong-password':       'Incorrect password. Try again.',
                    'auth/email-already-in-use': 'An account already exists with this email.',
                    'auth/weak-password':        'Password must be at least 6 characters.',
                    'auth/invalid-email':        'Please enter a valid email address.'
                };
                setAuthError(msgs[err.code] || err.message);
                if (submitBtn) submitBtn.disabled = false;
                if (btnSpan)   btnSpan.textContent = origText;
            }
        });
    }

    // Forgot password
    const forgotLink = document.querySelector('.forgot-password');
    if (forgotLink) {
        forgotLink.addEventListener('click', async e => {
            e.preventDefault();
            const email = document.getElementById('loginEmail')?.value?.trim();
            if (!email) {
                setAuthError('Enter your email address first, then click Forgot Password.');
                return;
            }
            try {
                await auth.sendPasswordResetEmail(email);
                setAuthError('');
                alert('Password reset email sent! Check your inbox.');
            } catch (err) {
                setAuthError(err.message);
            }
        });
    }

    // ============================================================
    //  AUTH STATE — Dashboard protection + data load
    // ============================================================
    auth.onAuthStateChanged(async user => {
        const isDashboard = document.body.classList.contains('dashboard-page');
        const isAuthPage  = document.body.classList.contains('auth-page');

        if (user) {
            if (isAuthPage) {
                window.location.href = 'dashboard.html';
                return;
            }

            if (isDashboard) {
                await loadDashboard(user);
            }
        } else {
            if (isDashboard) {
                window.location.href = 'login.html';
            }
        }
    });

    // ============================================================
    //  DASHBOARD LOAD
    // ============================================================
    async function loadDashboard(user) {
        const isAdmin = ADMIN_EMAILS.includes(user.email);

        // Show admin tab if needed
        const adminTab = document.getElementById('admin-portal-tab');
        if (adminTab && isAdmin) {
            adminTab.style.display = 'flex';
        }

        // Load student profile
        try {
            const doc = await db.collection('students').doc(user.uid).get();

            if (doc.exists) {
                const data = doc.data();
                setText('displayFullName', data.fullName || user.email.split('@')[0]);
                setText('userName',        (data.fullName || user.email.split('@')[0]).split(' ')[0]);
                setText('userRoll',        data.rollNumber ? 'Roll #' + data.rollNumber : '');
            } else {
                const name = user.email.split('@')[0];
                setText('displayFullName', name);
                setText('userName',        name);
            }

            // Load enrollments
            await loadEnrollments(user.uid);

            // Load admin panel
            if (isAdmin) {
                await loadAdminPanel();
            }

        } catch (err) {
            console.error('Dashboard load error:', err);
        }
    }

    async function loadEnrollments(uid) {
        const snap = await db.collection('students').doc(uid).collection('enrollments')
                              .orderBy('timestamp', 'desc').get();

        // Also check top-level enrollments tied to this uid
        const snap2 = await db.collection('enrollments').where('uid', '==', uid)
                               .orderBy('submittedAt', 'desc').get();

        const totalCoursesEl    = document.getElementById('totalCourses');
        const coursesContainer  = document.getElementById('coursesContainer');

        const allDocs = [...snap.docs, ...snap2.docs];
        const total   = allDocs.length;

        if (totalCoursesEl) totalCoursesEl.textContent = total;

        if (coursesContainer && total > 0) {
            coursesContainer.innerHTML = '';
            allDocs.forEach(d => {
                const e = d.data();
                const isPending = e.status === 'pending_verification' || e.paymentStatus === 'pending_verification' || e.status === 'form_submitted';
                coursesContainer.innerHTML += `
                    <div class="glass-card" style="padding:2rem; border-radius:16px; border:1px solid var(--border);">
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem;">
                            <h4 style="font-size:1rem; font-weight:600; color:var(--text-primary);">${e.course || e['course'] || 'Enrolled Course'}</h4>
                            <span style="padding:4px 12px; border-radius:100px; font-size:0.72rem; font-weight:600; letter-spacing:0.05em;
                                background:${isPending ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)'};
                                border:1px solid ${isPending ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'};
                                color:${isPending ? 'var(--amber)' : '#4ade80'};">
                                ${isPending ? 'Pending Verification' : 'Active'}
                            </span>
                        </div>
                        <p style="font-size:0.82rem; color:var(--text-muted);">
                            <i class="fas fa-calendar-alt" style="margin-right:6px;"></i>
                            ${e.timestamp?.toDate?.().toLocaleDateString() || e.submittedAt?.toDate?.().toLocaleDateString() || 'Just enrolled'}
                        </p>
                        <div style="margin-top:1.25rem; background:var(--bg-surface); border-radius:8px; height:6px; overflow:hidden;">
                            <div style="width:0%; height:100%; background:var(--amber); border-radius:8px;"></div>
                        </div>
                        <p style="font-size:0.75rem; color:var(--text-muted); margin-top:6px;">0% Complete</p>
                    </div>`;
            });
        } else if (coursesContainer) {
            coursesContainer.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-muted);">
                    <i class="fas fa-graduation-cap" style="font-size:2.5rem; margin-bottom:1rem; display:block; opacity:.4;"></i>
                    <p style="font-weight:500;">No enrollments yet.</p>
                    <a href="index.html#enroll" style="color:var(--amber); font-weight:600; text-decoration:none; margin-top:0.5rem; display:inline-block;">Enroll in a course →</a>
                </div>`;
        }
    }

    // ============================================================
    //  ADMIN PANEL
    // ============================================================
    async function loadAdminPanel() {
        const adminSection = document.getElementById('admin-section');
        const tableBody    = document.getElementById('studentsTableBody');
        const statsEl      = document.getElementById('adminTotalStudents');

        if (!adminSection) return;

        try {
            // Fetch ALL enrollments (top-level collection)
            const snap = await db.collection('enrollments').orderBy('submittedAt', 'desc').get();
            const rows = [];

            snap.forEach(doc => {
                const d   = doc.data();
                const ts  = d.submittedAt?.toDate?.().toLocaleDateString('en-PK') || '—';
                const status = d.status || 'unknown';
                const isPending = status.includes('pending') || status === 'form_submitted';

                rows.push({ id: doc.id, ...d, ts, isPending });
            });

            if (statsEl) statsEl.textContent = rows.length;

        // Update pending / active counts
        const pendingCount = rows.filter(r => r.isPending).length;
        const activeCount  = rows.length - pendingCount;
        const pendingEl = document.getElementById('adminPending');
        const activeEl  = document.getElementById('adminActive');
        if (pendingEl) pendingEl.textContent = pendingCount;
        if (activeEl)  activeEl.textContent  = activeCount;

            if (tableBody) {
                tableBody.innerHTML = rows.length === 0
                    ? `<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">No enrollments yet.</td></tr>`
                    : rows.map((r, i) => `
                        <tr style="border-bottom:1px solid var(--border);">
                            <td style="padding:1rem 0.75rem; color:var(--text-muted); font-size:0.8rem;">${i + 1}</td>
                            <td style="padding:1rem 0.75rem; font-weight:600; color:var(--text-primary);">${r.fullName || '—'}</td>
                            <td style="padding:1rem 0.75rem; color:var(--text-secondary); font-size:0.85rem;">${r.email || '—'}</td>
                            <td style="padding:1rem 0.75rem; color:var(--text-secondary); font-size:0.85rem;">${r.whatsapp || r.phone || '—'}</td>
                            <td style="padding:1rem 0.75rem; color:var(--text-secondary); font-size:0.82rem;">${r.course || '—'}</td>
                            <td style="padding:1rem 0.75rem;">
                                <span style="padding:3px 10px; border-radius:100px; font-size:0.7rem; font-weight:600;
                                    background:${r.isPending ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)'};
                                    border:1px solid ${r.isPending ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'};
                                    color:${r.isPending ? 'var(--amber)' : '#4ade80'};">
                                    ${r.isPending ? 'Pending' : 'Active'}
                                </span>
                            </td>
                            <td style="padding:1rem 0.75rem; color:var(--text-muted); font-size:0.8rem;">${r.ts}</td>
                        </tr>`).join('');
            }

            // Store rows for CSV export
            window._adminRows = rows;

        } catch (err) {
            console.error('Admin load error:', err);
        }
    }

    // ── CSV Export ──
    window.downloadStudentsCSV = function() {
        const rows = window._adminRows;
        if (!rows || rows.length === 0) { alert('No data to export.'); return; }

        const headers = ['#','Name','Email','WhatsApp','Course','City','Occupation','Department','Referral','Status','Submitted'];
        const csvRows = [headers.join(',')];

        rows.forEach((r, i) => {
            const vals = [
                i + 1,
                r.fullName  || '',
                r.email     || '',
                r.whatsapp  || r.phone || '',
                r.course    || '',
                r.city      || '',
                r.occupation|| '',
                r.department|| '',
                r.referral  || '',
                r.status    || '',
                r.ts        || ''
            ].map(v => `"${String(v).replace(/"/g, '""')}"`);
            csvRows.push(vals.join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `ZCP_Enrollments_${new Date().toLocaleDateString('en-PK').replace(/\//g,'-')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // ── Download CSV button ──
    const csvBtn = document.getElementById('downloadCsvBtn');
    if (csvBtn) csvBtn.addEventListener('click', window.downloadStudentsCSV);

    // ============================================================
    //  DASHBOARD NAV (sidebar tabs)
    // ============================================================
    const sidebarNav = document.querySelectorAll('.sidebar-nav a[data-section]');
    const dashSections = document.querySelectorAll('.dash-section');

    function switchSection(id) {
        sidebarNav.forEach(a => {
            const isActive = a.dataset.section === id;
            a.style.color       = isActive ? 'var(--amber)' : '';
            a.style.background  = isActive ? 'rgba(245,158,11,0.06)' : '';
            a.style.borderLeft  = isActive ? '3px solid var(--amber)' : '3px solid transparent';
        });
        dashSections.forEach(s => s.classList.toggle('active', s.id === `${id}-section`));
        const dc = document.querySelector('.dashboard-content');
        if (dc) dc.scrollTo({ top: 0, behavior: 'smooth' });
    }

    sidebarNav.forEach(a => {
        a.addEventListener('click', e => { e.preventDefault(); switchSection(a.dataset.section); });
    });

    document.querySelectorAll('[data-go-to]').forEach(a => {
        a.addEventListener('click', e => { e.preventDefault(); switchSection(a.dataset.goTo); });
    });

    // ============================================================
    //  LOGOUT
    // ============================================================
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => window.location.href = 'index.html');
        });
    }

    // ============================================================
    //  HELPERS
    // ============================================================
    function setText(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

});
