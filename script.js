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
    const storage = firebase.storage();

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
        const container = document.getElementById('coursesContainer');
        const select    = document.getElementById('course');
        if (!container && !select) return;

        try {
            // Fetch all courses to avoid index requirements and casing issues
            const snap = await db.collection('courses').get();
            const allFetched = [];
            snap.forEach(doc => allFetched.push({ id: doc.id, ...doc.data() }));

            // Filter for 'live' (case-insensitive) and sort by date in JS
            activeCourses = allFetched
                .filter(c => String(c.status || '').toLowerCase() === 'live')
                .sort((a, b) => {
                    const da = a.createdAt?.seconds || 0;
                    const db = b.createdAt?.seconds || 0;
                    return db - da;
                });

            // Render Cards on Landing Page
            if (container) {
                if (activeCourses.length === 0) {
                    container.innerHTML = `<div style="grid-column: span 12; text-align: center; padding: 4rem; opacity:0.6;"><p>New programs launching soon. Stay tuned!</p></div>`;
                } else {
                    container.innerHTML = activeCourses.map((c, i) => {
                        // Bento layout logic: first is featured, rest are third
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
                                    <a href="#enroll" class="pd-btn-primary" style="padding: 0.6rem 1.2rem; font-size: 0.85rem;" onclick="preSelectCourse('${c.id}')">Enroll Now</a>
                                </div>
                            </div>
                        `;
                    }).join('');
                    
                    // Re-init reveal observer for new elements
                    const newElements = container.querySelectorAll('[data-reveal]');
                    const observer = new IntersectionObserver((entries) => {
                        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('is-revealed'); });
                    }, { threshold: 0.1 });
                    newElements.forEach(el => observer.observe(el));
                }
            }

            // Populate Dropdown
            if (select) {
                select.innerHTML = '<option value="" disabled selected>Select a program</option>' + 
                    activeCourses.map(c => `<option value="${c.id}">${sanitize(c.title)}</option>`).join('');
            }

        } catch (err) {
            console.error('Error fetching courses:', err);
        }
    }

    // Helper for "Enroll Now" buttons on cards
    window.preSelectCourse = (courseId) => {
        const select = document.getElementById('course');
        if (select) {
            select.value = courseId;
            updateCourseDisplay(courseId);
            document.getElementById('enrollModal').classList.add('active');
            document.body.style.overflow = 'hidden';
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
                    courseId:       data.course, // store the ID
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

            // Load Student Enrollments
            const enrollSnap = await db.collection('enrollments')
                .where('email', '==', user.email) // Match by email as backup to UID
                .where('status', 'in', ['active', 'payment_confirmed'])
                .get();

            const coursesContainer = document.getElementById('coursesContainer');
            if (coursesContainer) {
                if (enrollSnap.empty) {
                    coursesContainer.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:3rem; opacity:0.5;"><i class="fas fa-box-open fa-2x"></i><p>No active courses found.</p></div>';
                } else {
                    let html = '';
                    for (const enrollDoc of enrollSnap.docs) {
                        const enrollData = enrollDoc.data();
                        // Fetch course metadata
                        const courseDoc = await db.collection('courses').doc(enrollData.courseId || enrollData.course).get();
                        const c = courseDoc.exists ? courseDoc.data() : { title: enrollData.courseName || enrollData.course, imageUrl: 'assets/course-placeholder.png' };
                        
                        html += `
                            <div class="course-card glass-card" style="padding:0; overflow:hidden; border:1px solid rgba(255,255,255,0.05);">
                                <div class="course-image" style="height:160px; position:relative;">
                                    <img src="${c.imageUrl || 'assets/course-placeholder.png'}" alt="${c.title}" style="width:100%; height:100%; object-fit:cover;">
                                    <div class="course-tag active" style="position:absolute; top:12px; right:12px; background:var(--amber); color:black; font-weight:700; font-size:0.7rem; padding:4px 10px; border-radius:100px;">ACTIVE BATCH</div>
                                </div>
                                <div class="course-content" style="padding:1.5rem;">
                                    <h3 class="course-title" style="font-size:1.1rem; color:white; margin-bottom:1rem;">${c.title}</h3>
                                    <div class="course-meta" style="display:flex; flex-direction:column; gap:8px; margin-bottom:1.5rem;">
                                        <span style="font-size:0.82rem; color:rgba(255,255,255,0.6); display:flex; align-items:center; gap:8px;">
                                            <i class="fas fa-calendar-check" style="color:var(--amber);"></i> ${c.startTime || 'Ongoing'}
                                        </span>
                                        <span style="font-size:0.82rem; color:rgba(255,255,255,0.6); display:flex; align-items:center; gap:8px;">
                                            <i class="fas fa-clock" style="color:var(--amber);"></i> ${c.timing || '8 PM - 10 PM'}
                                        </span>
                                    </div>
                                    <button onclick="openClassroom('${enrollData.courseId || enrollData.course}')" class="btn btn-primary btn-block" style="border-radius:10px; font-weight:700; letter-spacing:0.05em;">
                                        <i class="fas fa-door-open"></i> ACCESS CLASSROOM
                                    </button>
                                </div>
                            </div>
                        `;
                    }
                    coursesContainer.innerHTML = html;
                }
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

    // ============================================================
    //  CLASSROOM LOGIC (dashboard.html)
    // ============================================================
    window.openClassroom = async function(courseId) {
        const modal = document.getElementById('classroomModal');
        const list = document.getElementById('classroomContentList');
        const titleEl = document.getElementById('classroomTitle');
        
        if (modal) modal.classList.add('active');
        if (list) list.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:3rem;"><i class="fas fa-spinner fa-spin fa-2x"></i><p style="margin-top:1rem;">Entering Classroom...</p></div>';

        try {
            // Fetch course title for header
            const cDoc = await db.collection('courses').doc(courseId).get();
            if (cDoc.exists && titleEl) titleEl.textContent = cDoc.data().title;

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

});
