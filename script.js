// Korasty Interactive Language Learning Platform Engine
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, deleteDoc, onSnapshot, updateDoc, increment, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Global application state
let app, db;
let currentUserId = null;
let lessons = [];
let books = [];
let comments = [];
let currentLang = 'ar';
let currentGradeFilter = 'all';
let currentSubjectFilter = 'all';
let activeLessonId = null;

// Default high-quality seeded lessons (fallback if offline, or automatically uploaded if Firestore is empty)
const defaultLessons = [
  {
    title: 'حرف الألف المغامر 🦁',
    icon: '🦁',
    videoUrl: 'https://studentbooks.moe.gov.eg',
    grade: 'الأول الابتدائي',
    subject: 'عربي',
    description: 'رحلة ممتعة مع حرف الألف، لنتعلم كيف ننطقه ونكتبه، ونكتشف الكلمات والكتب المدرسية التفاعلية الرسمية من بوابة التعليم المصرية!',
    content: `
      <div class="space-y-6 text-right" dir="rtl">
        <div class="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
          <h4 class="text-xl font-bold text-indigo-700 mb-2">كيف ننطق حرف الألف؟ 🗣️</h4>
          <p class="text-gray-700 text-lg leading-relaxed">ينطق حرف الألف بصوت مفتوح <strong>(أَ)</strong> مثل <strong>أَ</strong>سَد، أو مضموم <strong>(أُ)</strong> مثل <strong>أُ</strong>ذُن، أو مكسور <strong>(إِ)</strong> مثل <strong>إِ</strong>بْرِيق!</p>
        </div>
        
        <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
          <h4 class="text-lg font-bold text-emerald-700 mb-2">تحميل الملازم الرسمية للكتب المدرسية: 📚</h4>
          <p class="text-gray-600 text-sm mb-3">يمكنك تحميل الملخصات الرسمية وكتب الوزارة للصف الأول الابتدائي من بوابة التعليم المصرية الموثوقة:</p>
          <a href="https://studentbooks.moe.gov.eg" target="_blank" class="inline-block px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700 transition-colors">زيارة منصة الكتب الرسمية 🇪🇬</a>
        </div>
      </div>
    `,
    likes: 12,
    createdAt: Date.now() - 50000
  },
  {
    title: 'Magic Phonics: Letter A 🍎',
    icon: '🍎',
    videoUrl: 'https://share.google/61A9wcnEJc8rucDyl',
    grade: 'الأول الابتدائي',
    subject: 'إنجليزي',
    description: 'Embark on a colorful adventure to learn the sound of letter A and search hundreds of kids English storybooks on Google Search!',
    content: `
      <div class="space-y-6 text-left" dir="ltr">
        <div class="p-4 bg-rose-50 rounded-2xl border border-rose-100">
          <h4 class="text-xl font-bold text-rose-700 mb-2">The Sound of Letter A 🔊</h4>
          <p class="text-gray-700 text-lg leading-relaxed">Letter A makes the short sound <strong>/æ/</strong> (like in <em>apple</em>) and the long sound <strong>/eɪ/</strong> (like in <em>cake</em>)!</p>
        </div>
        
        <div class="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
          <h4 class="text-lg font-bold text-indigo-700 mb-2">Search English Books Collection: 🔍</h4>
          <p class="text-gray-600 text-sm mb-3">Find real curated kid books with English Phonics and stories directly on Google:</p>
          <a href="https://share.google/61A9wcnEJc8rucDyl" target="_blank" class="inline-block px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-colors">Explore English Books Search 🎒</a>
        </div>
      </div>
    `,
    likes: 19,
    createdAt: Date.now() - 30000
  },
  {
    title: 'Everybody Up 3: Welcome Lesson! 🎒',
    icon: '🎒',
    videoUrl: 'https://online.flipbuilder.com/xtrvf/epya/',
    grade: 'الثالث الابتدائي',
    subject: 'إنجليزي',
    description: 'A friendly starter lesson for Everybody Up 3! Explore grammar structures, learn greetings, and use interactive vocabulary.',
    content: `
      <div class="space-y-6 text-left" dir="ltr">
        <div class="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
          <h4 class="text-xl font-bold text-indigo-700 mb-2">Let's Get Started! 👋</h4>
          <p class="text-gray-700 text-lg leading-relaxed">Welcome back to school! Let's practice introducing ourselves and talking about our favorite activities using our primary Oxford books.</p>
        </div>
        
        <div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
          <h4 class="text-lg font-bold text-emerald-700 mb-2">Useful Phrases & Structures:</h4>
          <ul class="list-disc pl-5 text-gray-700 space-y-2 text-sm font-semibold">
            <li>"What is your name?" -> "My name is Amina!"</li>
            <li>"What is your favorite subject?" -> "My favorite subject is English!"</li>
            <li>"Do you have a textbook?" -> "Yes, I have the Everybody Up 3 book!"</li>
          </ul>
        </div>

        <div class="text-center p-4 bg-pink-50 rounded-2xl border border-pink-100">
          <h4 class="text-lg font-bold text-pink-700 mb-2">Read Book Oxford Online: 📖</h4>
          <p class="text-gray-600 text-sm mb-3">You can view your student book page by page interactively:</p>
          <a href="https://online.flipbuilder.com/xtrvf/epya/" target="_blank" class="inline-block px-6 py-2.5 bg-pink-600 text-white font-bold rounded-xl shadow-md hover:bg-pink-700 transition-colors">Open Flipbook Oxford</a>
        </div>
      </div>
    `,
    likes: 24,
    createdAt: Date.now() - 20000
  }
];

const defaultBooks = [
  {
    title: 'Everybody Up 3 - Student Book (Oxford Digital Flipbook) 🎒',
    url: 'https://online.flipbuilder.com/xtrvf/epya/',
    grade: 'الثالث الابتدائي',
    icon: '📘',
    createdAt: Date.now() - 10000
  },
  {
    title: 'المنصة التعليمية المصرية الأولى لتحميل الكتب والملازم PDF 🏫',
    url: 'https://studentbooks.moe.gov.eg',
    grade: 'جميع الصفوف',
    icon: '🏫',
    createdAt: Date.now() - 9500
  },
  {
    title: 'Egypt Studentbooks Google Curated Search 🇪🇬',
    url: 'https://share.google/2qIi4youSjtyGIKEn',
    grade: 'جميع الصفوف',
    icon: '🇪🇬',
    createdAt: Date.now() - 9300
  },
  {
    title: 'English Learning Books Curated Google Search 📖',
    url: 'https://share.google/eXseOi6w9XfAAlE2J',
    grade: 'جميع الصفوف',
    icon: '📖',
    createdAt: Date.now() - 9200
  },
  {
    title: 'Edu2-Egypt Curriculum Portal 🎓',
    url: 'https://edu2-egypt.com',
    grade: 'جميع الصفوف',
    icon: '🎓',
    createdAt: Date.now() - 9150
  },
  {
    title: 'Edu2-Egypt Textbook Download Library 📚',
    url: 'https://edu2-egypt.com/books',
    grade: 'جميع الصفوف',
    icon: '📚',
    createdAt: Date.now() - 9120
  },
  {
    title: 'Egypt Learning Kids Books Curated Search 👶',
    url: 'https://share.google/rDQArAyvSHHtk7ETe',
    grade: 'جميع الصفوف',
    icon: '👶',
    createdAt: Date.now() - 9110
  },
  {
    title: 'Arabic Learning Kids Books Curated Search 🦁',
    url: 'https://share.google/3ZZ79JXF4YlamgSxG',
    grade: 'جميع الصفوف',
    icon: '🦁',
    createdAt: Date.now() - 9100
  },
  {
    title: 'English Learning Kids Books Search Collection 🍎',
    url: 'https://share.google/CxKU7utRlzOoEedzD',
    grade: 'جميع الصفوف',
    icon: '🍎',
    createdAt: Date.now() - 9090
  },
  {
    title: 'Oxford University Press Young Learners Courses 🇬🇧',
    url: 'https://elt.oup.com/learning_resources/courses/younglearners/?cc=global',
    grade: 'جميع الصفوف',
    icon: '🇬🇧',
    createdAt: Date.now() - 9080
  },
  {
    title: 'Amira Rashad Premium Educational Portal ✨',
    url: 'https://amirarashad.com',
    grade: 'جميع الصفوف',
    icon: '✨',
    createdAt: Date.now() - 9070
  },
  {
    title: 'Mostafa Atef English Learning Platform 🗣️',
    url: 'https://mostafaatefenglish.com',
    grade: 'جميع الصفوف',
    icon: '🗣️',
    createdAt: Date.now() - 9060
  },
  {
    title: 'Mostafa Atef English Trainer Portal 🎖️',
    url: 'https://mostafaatefenglishtrainer.com',
    grade: 'جميع الصفوف',
    icon: '🎖️',
    createdAt: Date.now() - 9050
  },
  {
    title: 'British Council Learn English Kids Center 🏛️',
    url: 'https://learnenglishkids.britishcouncil.org',
    grade: 'جميع الصفوف',
    icon: '🏛️',
    createdAt: Date.now() - 9040
  },
  {
    title: 'Starfall Kids Teacher Books & Guides 🏫',
    url: 'https://teach.starfall.com/books',
    grade: 'جميع الصفوف',
    icon: '🏫',
    createdAt: Date.now() - 9030
  },
  {
    title: 'Everybody Up 3 - Full Materials & Audios Folder 📂',
    url: 'https://drive.google.com/drive/folders/1C-tv-oe9eL5ScqlyjXbRYrwTLuqWoZmL?usp=sharing',
    grade: 'جميع الصفوف',
    icon: '📂',
    createdAt: Date.now() - 9000
  },
  {
    title: 'English Storybooks Curated Google Search 🔍',
    url: 'https://share.google/61A9wcnEJc8rucDyl',
    grade: 'جميع الصفوف',
    icon: '🔍',
    createdAt: Date.now() - 8500
  },
  {
    title: 'English Textbooks Collection for Kids 📚',
    url: 'https://frenglish.ru/16_eng_books.html',
    grade: 'جميع الصفوف',
    icon: '📖',
    createdAt: Date.now() - 8000
  },
  {
    title: 'English Language Interactive Skills 🎯',
    url: 'https://frenglish.ru/10_eng_learn.html',
    grade: 'جميع الصفوف',
    icon: '🎯',
    createdAt: Date.now() - 7000
  },
  {
    title: 'Kids Speaking & Audiobooks Library 🎧',
    url: 'https://frenglish.ru/12_eng_audio.html',
    grade: 'جميع الصفوف',
    icon: '🎧',
    createdAt: Date.now() - 6000
  },
  {
    title: 'English Lessons & Fun Video Activities 🎬',
    url: 'https://frenglish.ru/video-english.html',
    grade: 'جميع الصفوف',
    icon: '🎬',
    createdAt: Date.now() - 5000
  },
  {
    title: 'Interactive Phonics Software & Games 💻',
    url: 'https://frenglish.ru/19-english-soft.html',
    grade: 'جميع الصفوف',
    icon: '💻',
    createdAt: Date.now() - 4000
  },
  {
    title: 'English for Kindergartens & Young Learners 🧸',
    url: 'https://frenglish.ru/22_eng_kinder.html',
    grade: 'جميع الصفوف',
    icon: '🧸',
    createdAt: Date.now() - 3000
  },
  {
    title: 'Business English Vocabulary & Textbooks 💼',
    url: 'https://frenglish.ru/18_eng_buisness.html',
    grade: 'جميع الصفوف',
    icon: '💼',
    createdAt: Date.now() - 2000
  },
  {
    title: 'Technical English & IT Terminology 🖥️',
    url: 'https://frenglish.ru/19_eng_it.html',
    grade: 'جميع الصفوف',
    icon: '🖥️',
    createdAt: Date.now() - 1000
  }
];

// Firebase Configuration fallbacks
const firebaseConfig = {
  apiKey: "AIzaSyA3veGNfImGfzy4Gk56LwabkNYpH5vdsTY",
  authDomain: "gen-lang-client-0028771609.firebaseapp.com",
  projectId: "gen-lang-client-0028771609",
  storageBucket: "gen-lang-client-0028771609.firebasestorage.app",
  messagingSenderId: "1018901444622",
  appId: "1:1018901444622:web:027865f679905eca38645f"
};

// Initialize app & firestore
try {
  app = initializeApp(firebaseConfig);
  // Important: Explicitly pass custom Database ID mapped from configuration
  db = getFirestore(app, "ai-studio-webgen-1c27451c-99bc-4b84-bb0d-a8d0fa490da9");

  // Generate a persistent local session user ID to ensure liking and commenting are tracked locally while Firestore is kept alive
  if (!localStorage.getItem("korasty_user_session_id")) {
    localStorage.setItem("korasty_user_session_id", "anon_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9));
  }
  currentUserId = localStorage.getItem("korasty_user_session_id");
  
  // Directly start Firestore real-time synchronization listeners!
  setupDatabaseListeners();
} catch (error) {
  console.warn("Firebase Init failed. Local fallback initialized.", error);
  initializeLocalFallback();
}

// Set up real-time listener syncing
function setupDatabaseListeners() {
  // 1. Lessons syncing
  const lessonsCol = collection(db, "korasty_lessons");
  onSnapshot(lessonsCol, async (snapshot) => {
    const fetched = [];
    snapshot.forEach(docSnap => {
      fetched.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Deduplicate fetched list by title to ensure NO duplicates show up in the UI
    const uniqueFetched = [];
    const seenTitles = new Set();
    fetched.forEach(item => {
      const normalizedTitle = (item.title || "").trim().toLowerCase();
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        uniqueFetched.push(item);
      } else {
        // Automatically prune the duplicate from Firestore!
        try {
          deleteDoc(doc(db, "korasty_lessons", item.id));
        } catch (e) {
          console.warn("Could not delete duplicate lesson record from DB:", e);
        }
      }
    });

    lessons = [...uniqueFetched];

    // Seed if empty and lock to prevent dual seeding in the same session
    if (lessons.length === 0) {
      lessons = defaultLessons.map((dl, i) => ({ id: `seed-lesson-${i}`, ...dl }));
      if (!window.hasSeededLessonsDb) {
        window.hasSeededLessonsDb = true;
        defaultLessons.forEach(async (lessonItem) => {
          try {
            await addDoc(collection(db, "korasty_lessons"), lessonItem);
          } catch (e) {
            console.warn("Could not write seed lesson:", e);
          }
        });
      }
    }

    lessons.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    renderLessons();
    renderAdminLessonsList();
  }, (err) => {
    console.warn("Lessons Firestore listener error. Falling back.", err);
    initializeLocalFallback();
  });

  // 2. Books syncing
  const booksCol = collection(db, "korasty_books");
  onSnapshot(booksCol, (snapshot) => {
    const fetched = [];
    snapshot.forEach(docSnap => {
      fetched.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Deduplicate fetched list by title or URL
    const uniqueFetched = [];
    const seenBooks = new Set();
    fetched.forEach(item => {
      const key = ((item.title || "").trim() + "|" + (item.url || "").trim()).toLowerCase();
      if (!seenBooks.has(key)) {
        seenBooks.add(key);
        uniqueFetched.push(item);
      } else {
        // Automatically prune the duplicate from Firestore!
        try {
          deleteDoc(doc(db, "korasty_books", item.id));
        } catch (e) {
          console.warn("Could not delete duplicate book record from DB:", e);
        }
      }
    });

    books = [...uniqueFetched];

    if (books.length === 0) {
      books = defaultBooks.map((dbk, i) => ({ id: `seed-book-${i}`, ...dbk }));
      if (!window.hasSeededBooksDb) {
        window.hasSeededBooksDb = true;
        defaultBooks.forEach(async (bookItem) => {
          try {
            await addDoc(collection(db, "korasty_books"), bookItem);
          } catch (e) {
            console.warn("Could not write seed book:", e);
          }
        });
      }
    }

    books.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    renderBooks();
  });

  // 3. Comments syncing
  const commentsCol = collection(db, "korasty_comments");
  onSnapshot(commentsCol, (snapshot) => {
    comments = [];
    snapshot.forEach(docSnap => {
      comments.push({ id: docSnap.id, ...docSnap.data() });
    });
    comments.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (activeLessonId) {
      renderModalComments(activeLessonId);
    }
  });
}

// Auto-seed function to pre-populate database for instant usage if completely empty
async function autoSeedDatabase() {
  // Left for compatibility, handled elegantly in setupDatabaseListeners with duplicate checking
}

// Local storage fallback if offline
function initializeLocalFallback() {
  const localLessons = localStorage.getItem("korasty_fallback_lessons");
  const localBooks = localStorage.getItem("korasty_fallback_books");
  const localComments = localStorage.getItem("korasty_fallback_comments");

  lessons = localLessons ? JSON.parse(localLessons) : defaultLessons.map((l, i) => ({ id: `local-lesson-${i}`, ...l }));
  books = localBooks ? JSON.parse(localBooks) : defaultBooks.map((b, i) => ({ id: `local-book-${i}`, ...b }));
  comments = localComments ? JSON.parse(localComments) : [];

  renderLessons();
  renderBooks();
  renderAdminLessonsList();
}

function saveLocalFallback() {
  localStorage.setItem("korasty_fallback_lessons", JSON.stringify(lessons));
  localStorage.setItem("korasty_fallback_books", JSON.stringify(books));
  localStorage.setItem("korasty_fallback_comments", JSON.stringify(comments));
}

// UI RENDERING AND INTERACTIONS

function renderLessons() {
  const grid = document.getElementById('lessonsGrid');
  if (!grid) return;

  const searchInput = document.getElementById('searchInput');
  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const filtered = lessons.filter(lesson => {
    const matchGrade = currentGradeFilter === 'all' || lesson.grade === currentGradeFilter;
    const matchSubject = currentSubjectFilter === 'all' || lesson.subject === currentSubjectFilter;
    
    const titleMatch = lesson.title ? lesson.title.toLowerCase().includes(searchQuery) : false;
    const descMatch = lesson.description ? lesson.description.toLowerCase().includes(searchQuery) : false;
    const subjMatch = lesson.subject ? lesson.subject.toLowerCase().includes(searchQuery) : false;
    const matchSearch = searchQuery === '' || titleMatch || descMatch || subjMatch;

    return matchGrade && matchSubject && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full bg-white/80 border border-gray-100 p-12 rounded-3xl text-center shadow-xs">
        <div class="text-5xl mb-4">🔍</div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">
          ${currentLang === 'ar' ? 'لا توجد نتائج مطابقة!' : 'No matching items found!'}
        </h3>
        <p class="text-gray-500">
          ${currentLang === 'ar' ? 'حاول تغيير الفلاتر أو كتابة عبارة بحث أخرى.' : 'Try changing filters or using different keywords.'}
        </p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(lesson => {
    return `
      <div class="lesson-card bg-white rounded-3xl border border-gray-100/80 shadow-xs flex flex-col overflow-hidden">
        <div class="p-6 text-center bg-gradient-to-br from-indigo-50 to-pink-50/50 relative border-b border-gray-50">
          <div class="text-5xl mb-3 transform hover:scale-110 transition-transform cursor-default">${lesson.icon || '📚'}</div>
          <h4 class="text-lg font-bold text-gray-800 line-clamp-1">${lesson.title}</h4>
          <span class="inline-block mt-2 px-3 py-1 bg-white border border-indigo-100 text-indigo-600 text-xs font-semibold rounded-full">
            ${lesson.grade} • ${lesson.subject}
          </span>
        </div>
        <div class="p-6 flex-1 flex flex-col justify-between">
          <p class="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">${lesson.description}</p>
          
          <div class="pt-4 border-t border-gray-50 flex items-center justify-between">
            <button onclick="toggleLike('${lesson.id}')" class="flex items-center gap-2 px-3 py-1.5 bg-pink-50/50 hover:bg-pink-50 border border-pink-100/50 hover:border-pink-200 rounded-full text-pink-600 text-sm transition-all">
              <span>❤️</span>
              <span class="font-bold">${lesson.likes || 0}</span>
            </button>
            
            <button onclick="openLessonModal('${lesson.id}')" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl shadow-xs transition-all">
              ${currentLang === 'ar' ? 'ابدأ الدرس 🚀' : 'Start Lesson 🚀'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderBooks() {
  const grid = document.getElementById('booksGrid');
  if (!grid) return;

  const filteredBooks = books.filter(b => {
    return currentGradeFilter === 'all' || b.grade === currentGradeFilter || b.grade === 'جميع الصفوف';
  });

  if (filteredBooks.length === 0) {
    grid.innerHTML = `
      <p class="text-gray-500 text-center col-span-full py-12 bg-white/50 rounded-2xl border border-dashed border-gray-200">
        ${currentLang === 'ar' ? 'لا توجد كتب PDF مضافة حالياً لهذا الصف.' : 'No PDF books available for this grade yet.'}
      </p>
    `;
    return;
  }

  grid.innerHTML = filteredBooks.map(book => {
    // Standardize Google Drive URLs
    let viewUrl = book.url || '';
    if (viewUrl.includes('drive.google.com') && !viewUrl.includes('/preview') && !viewUrl.includes('/view')) {
      viewUrl = viewUrl.replace('/view?usp=sharing', '/preview').replace('/view', '/preview');
    }

    return `
      <div class="book-card bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-col justify-between">
        <div class="flex items-start gap-4 mb-4">
          <div class="text-4xl p-2 bg-pink-50 rounded-xl">${book.icon || '📕'}</div>
          <div>
            <h5 class="text-sm font-bold text-gray-800 line-clamp-2">${book.title}</h5>
            <span class="inline-block mt-1 text-xs text-pink-500 font-semibold bg-pink-50/30 px-2 py-0.5 rounded-full">${book.grade || 'جميع الصفوف'}</span>
          </div>
        </div>
        <a href="${viewUrl}" target="_blank" class="w-full text-center py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl block transition-colors">
          ${currentLang === 'ar' ? 'تحميل / تصفح الكتاب ↗' : 'View / Download PDF ↗'}
        </a>
      </div>
    `;
  }).join('');
}

function renderAdminLessonsList() {
  const listEl = document.getElementById('adminLessonsList');
  if (!listEl) return;

  if (lessons.length === 0) {
    listEl.innerHTML = `<p class="text-gray-500 py-6 text-center">${currentLang === 'ar' ? 'لا توجد دروس حالياً.' : 'No lessons yet.'}</p>`;
    return;
  }

  listEl.innerHTML = `
    <div class="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
      <table class="w-full text-right border-collapse bg-white">
        <thead>
          <tr class="bg-indigo-600 text-white text-sm">
            <th class="p-4">${currentLang === 'ar' ? 'العنوان' : 'Title'}</th>
            <th class="p-4">${currentLang === 'ar' ? 'المادة والصف' : 'Subject & Grade'}</th>
            <th class="p-4 text-center">${currentLang === 'ar' ? 'الإجراء' : 'Actions'}</th>
          </tr>
        </thead>
        <tbody class="text-sm text-gray-700 divide-y divide-gray-100">
          ${lessons.map(l => `
            <tr>
              <td class="p-4 font-bold flex items-center gap-2">
                <span>${l.icon || '📖'}</span>
                <span>${l.title}</span>
              </td>
              <td class="p-4">${l.subject} - ${l.grade}</td>
              <td class="p-4 text-center">
                <button onclick="deleteLesson('${l.id}')" class="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 font-semibold rounded-lg transition-colors text-xs">
                  ${currentLang === 'ar' ? 'حذف الدرس' : 'Delete'}
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// BIND FUNCTIONS EXPLICITLY TO WINDOW OBJECT (Solves standard scope bugs in HTML module loaders)
window.toggleLanguage = function() {
  currentLang = currentLang === 'ar' ? 'en' : 'ar';
  document.body.setAttribute('data-lang', currentLang);
  document.documentElement.setAttribute('data-lang', currentLang);
  document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');

  // Trigger Google Translate programmatically to translate entire application automatically!
  try {
    const googleCombo = document.querySelector('.goog-te-combo');
    if (googleCombo) {
      googleCombo.value = currentLang === 'ar' ? 'ar' : 'en';
      googleCombo.dispatchEvent(new Event('change'));
    }
  } catch (err) {
    console.warn("Google translate automation failed, using layout fallback.", err);
  }

  // Toggle active views based on selected language
  document.querySelectorAll('.ar-text').forEach(el => {
    const hasEnSibling = el.parentElement && el.parentElement.querySelector('.en-text');
    if (currentLang === 'ar') {
      el.classList.remove('hidden');
      el.style.display = '';
    } else {
      if (hasEnSibling) {
        el.classList.add('hidden');
        el.style.display = 'none';
      }
    }
  });
  document.querySelectorAll('.en-text').forEach(el => {
    const hasArSibling = el.parentElement && el.parentElement.querySelector('.ar-text');
    if (currentLang === 'en') {
      el.classList.remove('hidden');
      el.style.display = '';
    } else {
      if (hasArSibling) {
        el.classList.add('hidden');
        el.style.display = 'none';
      }
    }
  });

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.placeholder = currentLang === 'ar' ? 'ابحث عن درس، لغة، أو كلمة...' : 'Search for a lesson, language, or word...';
  }

  renderLessons();
  renderBooks();
  renderAdminLessonsList();
};

window.filterByGrade = function(grade) {
  currentGradeFilter = grade;
  document.querySelectorAll('.class-btn').forEach(btn => {
    btn.classList.remove('active', 'bg-indigo-600', 'text-white', 'border-indigo-600');
    btn.classList.add('bg-slate-50', 'text-slate-700');
    btn.setAttribute('aria-pressed', 'false');
  });

  if (typeof event !== 'undefined' && event.currentTarget) {
    const activeBtn = event.currentTarget;
    activeBtn.classList.add('active', 'bg-indigo-600', 'text-white', 'border-indigo-600');
    activeBtn.classList.remove('bg-slate-50', 'text-slate-700');
    activeBtn.setAttribute('aria-pressed', 'true');
  }

  renderLessons();
  renderBooks();
};

window.filterBySubject = function(subject) {
  currentSubjectFilter = subject;
  document.querySelectorAll('.subject-btn').forEach(btn => {
    btn.classList.remove('active', 'bg-pink-600', 'text-white', 'border-pink-600');
    btn.classList.add('bg-transparent', 'text-slate-700', 'border-slate-200');
    btn.setAttribute('aria-pressed', 'false');
  });

  if (typeof event !== 'undefined' && event.currentTarget) {
    const activeBtn = event.currentTarget;
    activeBtn.classList.add('active', 'bg-pink-600', 'text-white', 'border-pink-600');
    activeBtn.classList.remove('bg-transparent', 'text-slate-700', 'border-slate-200');
    activeBtn.setAttribute('aria-pressed', 'true');
  }

  renderLessons();
};

window.filterLessons = function() {
  renderLessons();
};

window.toggleLike = async function(id) {
  const lessonIndex = lessons.findIndex(l => l.id === id);
  if (lessonIndex === -1) return;

  if (db && !id.startsWith('local-')) {
    try {
      const docRef = doc(db, "korasty_lessons", id);
      await updateDoc(docRef, {
        likes: increment(1)
      });
      showToast(currentLang === 'ar' ? 'تم تسجيل الإعجاب بنجاح! ❤️' : 'Liked successfully! ❤️');
    } catch (e) {
      console.warn("Firestore like increment failed. Falling back to local update.", e);
      lessons[lessonIndex].likes = (lessons[lessonIndex].likes || 0) + 1;
      renderLessons();
      saveLocalFallback();
    }
  } else {
    lessons[lessonIndex].likes = (lessons[lessonIndex].likes || 0) + 1;
    renderLessons();
    saveLocalFallback();
  }
};

window.openLessonModal = function(id) {
  activeLessonId = id;
  const lesson = lessons.find(l => l.id === id);
  if (!lesson) return;

  const modal = document.getElementById('lessonModal');
  const titleEl = document.getElementById('modalTitle');
  const videoContainer = document.getElementById('modalVideoContainer');
  const contentBody = document.getElementById('modalContentBody');

  if (titleEl) titleEl.innerText = lesson.title;

  // Process embedding URL or external portal redirection cleanly to prevent broken iframes
  if (videoContainer) {
    if (lesson.videoUrl && lesson.videoUrl.trim() !== '') {
      let embedUrl = lesson.videoUrl.trim();
      const isEmbeddable = embedUrl.includes('youtube.com/embed') || 
                           embedUrl.includes('youtube-nocookie.com') ||
                           (embedUrl.includes('youtube.com/watch') && !embedUrl.includes('list=')) ||
                           embedUrl.includes('youtu.be/') ||
                           (embedUrl.includes('drive.google.com') && (embedUrl.includes('/file/d/') || embedUrl.includes('/preview')));

      if (isEmbeddable) {
        if (embedUrl.includes('drive.google.com')) {
          embedUrl = embedUrl.replace('/view?usp=sharing', '/preview').replace('/view', '/preview');
        } else if (embedUrl.includes('youtube.com/watch?v=')) {
          embedUrl = embedUrl.replace('watch?v=', 'embed/');
        } else if (embedUrl.includes('youtu.be/')) {
          const parts = embedUrl.split('/');
          const id = parts[parts.length - 1];
          embedUrl = `https://www.youtube.com/embed/${id}`;
        }
        videoContainer.innerHTML = `
          <div class="video-frame-wrapper border border-gray-100 rounded-2xl overflow-hidden aspect-video">
            <iframe src="${embedUrl}" class="w-full h-full" allowfullscreen allow="autoplay"></iframe>
          </div>
        `;
      } else {
        // Render a beautiful, interactive glowing direct-access button for educational websites
        videoContainer.innerHTML = `
          <div class="p-8 bg-gradient-to-r from-indigo-50 to-pink-50 rounded-2xl border-2 border-indigo-100 text-center flex flex-col items-center gap-4">
            <span class="text-5xl animate-pulse">🔗</span>
            <div>
              <h4 class="font-extrabold text-slate-800 text-sm mb-1">
                ${currentLang === 'ar' ? 'مصدر خارجي تفاعلي مباشر' : 'Direct Interactive Educational Portal'}
              </h4>
              <p class="text-xs text-slate-500 max-w-md">
                ${currentLang === 'ar' ? 'هذا الرابط يقودك مباشرة إلى المنصة التعليمية أو الكتاب المفتوح لتصفحه بكامل طاقته ومميزاته.' : 'This link directs you safely to the interactive textbook or platform to experience full features.'}
              </p>
            </div>
            <a href="${embedUrl}" target="_blank" class="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all hover:scale-105 inline-flex items-center gap-2">
              <span>🚀</span>
              <span>${currentLang === 'ar' ? 'انتقال إلى الرابط التعليمي الآن' : 'Go to Educational Portal Now'}</span>
            </a>
          </div>
        `;
      }
    } else {
      videoContainer.innerHTML = `
        <div class="p-8 bg-indigo-50/50 rounded-2xl border-2 border-dashed border-indigo-100 text-center text-indigo-500">
          <span class="text-4xl block mb-2">🎥</span>
          <span class="font-bold text-sm">
            ${currentLang === 'ar' ? 'لا يوجد فيديو مسجل لهذا الدرس.' : 'No recorded video link provided for this lesson.'}
          </span>
        </div>
      `;
    }
  }

  if (contentBody) {
    contentBody.innerHTML = `
      <h3 class="text-xl font-bold text-indigo-700 mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
        <span>📖</span>
        <span>${currentLang === 'ar' ? 'محتوى الدرس التفاعلي' : 'Interactive Lesson Content'}</span>
      </h3>
      <div class="text-gray-700 leading-relaxed">${lesson.content}</div>
    `;
  }

  renderModalComments(id);

  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Stop background scrolling
  }
};

window.closeLessonModal = function() {
  const modal = document.getElementById('lessonModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
  activeLessonId = null;
};

// Render comments and discussions
function renderModalComments(lessonId) {
  const container = document.getElementById('commentsListContainer');
  if (!container) return;

  const lessonComments = comments.filter(c => c.lessonId === lessonId);

  if (lessonComments.length === 0) {
    container.innerHTML = `
      <div class="p-6 bg-slate-50 rounded-xl text-center border border-slate-100/80">
        <span class="text-3xl block mb-2">🙋‍♂️</span>
        <p class="text-sm font-semibold text-slate-500">
          ${currentLang === 'ar' ? 'كن أول من يطرح سؤالاً أو يشارك بمناقشة!' : 'Be the first to ask a question or join the discussion!'}
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = lessonComments.map(c => `
    <div class="comment-item bg-slate-50/60 hover:bg-slate-50 p-4 rounded-xl border-r-4 border-indigo-500 transition-colors">
      <div class="flex justify-between items-center mb-2">
        <span class="font-bold text-indigo-900 text-sm flex items-center gap-1.5">
          <span>👶</span> <span>${c.author}</span>
        </span>
        <span class="text-xs text-gray-400">${c.time || (currentLang === 'ar' ? 'الآن' : 'Just now')}</span>
      </div>
      <p class="text-gray-700 text-sm leading-relaxed">${c.text}</p>
    </div>
  `).join('');
}

window.submitComment = async function(event) {
  event.preventDefault();
  const nameInput = document.getElementById('commenterName');
  const textInput = document.getElementById('commentText');

  if (!activeLessonId || !nameInput || !textInput) return;

  const name = nameInput.value.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const text = textInput.value.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Client-side validations
  if (name.length < 2) {
    showToast(currentLang === 'ar' ? 'الرجاء إدخال اسم صحيح (حرفين على الأقل)' : 'Please enter a valid name (at least 2 characters)', true);
    return;
  }
  if (text.length < 3) {
    showToast(currentLang === 'ar' ? 'الرجاء كتابة سؤال أو تعليق مفيد (3 أحرف على الأقل)' : 'Please enter a meaningful question (at least 3 characters)', true);
    return;
  }

  const newComment = {
    lessonId: activeLessonId,
    author: name,
    text: text,
    time: currentLang === 'ar' ? 'الآن' : 'Just now',
    createdAt: Date.now()
  };

  if (db) {
    try {
      await addDoc(collection(db, "korasty_comments"), newComment);
      showToast(currentLang === 'ar' ? 'تم نشر سؤالك بنجاح! 💬' : 'Question posted successfully! 💬');
    } catch (e) {
      console.warn("Firestore comment upload failed. Local fallback used.", e);
      comments.unshift({ id: `local-comment-${Date.now()}`, ...newComment });
      renderModalComments(activeLessonId);
      saveLocalFallback();
    }
  } else {
    comments.unshift({ id: `local-comment-${Date.now()}`, ...newComment });
    renderModalComments(activeLessonId);
    saveLocalFallback();
  }

  textInput.value = '';
};

// Admin Functions with dynamic secure custom HTML password modal prompt
window.openPasswordModal = function() {
  const modal = document.getElementById('passwordModal');
  const input = document.getElementById('adminPasswordInput');
  if (modal) {
    modal.classList.add('active');
    if (input) {
      input.value = '';
      input.focus();
    }
  }
};

window.closePasswordModal = function() {
  const modal = document.getElementById('passwordModal');
  if (modal) {
    modal.classList.remove('active');
  }
};

window.validateAdminPassword = function() {
  const input = document.getElementById('adminPasswordInput');
  if (!input) return;
  const pass = input.value.trim();
  if (pass === '784') {
    window.closePasswordModal();
    window.openAdminModal();
    showToast(currentLang === 'ar' ? 'أهلاً بك يا مشرف كراستي! 🔐' : 'Welcome back, Korasty Admin! 🔐');
  } else {
    showToast(currentLang === 'ar' ? 'كلمة المرور غير صحيحة!' : 'Incorrect password!', true);
    input.value = '';
    input.focus();
  }
};

window.openAdminModal = function() {
  const modal = document.getElementById('adminModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    renderAdminLessonsList();
  }
};

window.closeAdminModal = function() {
  const modal = document.getElementById('adminModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

window.switchAdminTab = function(index) {
  document.querySelectorAll('.admin-tab').forEach((tab, i) => {
    tab.classList.toggle('active', i === index);
  });
  document.querySelectorAll('.admin-content').forEach((content, i) => {
    content.classList.toggle('active', i === index);
  });
};

window.handleAddLesson = async function(event) {
  event.preventDefault();

  const titleEl = document.getElementById('lessonTitleInput');
  const iconEl = document.getElementById('lessonIconInput');
  const videoEl = document.getElementById('lessonVideoInput');
  const gradeEl = document.getElementById('lessonGradeInput');
  const subjectEl = document.getElementById('lessonSubjectInput');
  const descEl = document.getElementById('lessonDescInput');
  const contentEl = document.getElementById('lessonContentInput');

  if (!titleEl || !iconEl || !gradeEl || !subjectEl || !descEl || !contentEl) return;

  const title = titleEl.value.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const icon = iconEl.value.trim();
  const videoUrl = videoEl ? videoEl.value.trim() : '';
  const description = descEl.value.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const content = contentEl.value.trim(); // Allow safe embedding/HTML content but warn if empty

  // Strict Client-Side Input Validations
  if (title.length < 3) {
    showToast(currentLang === 'ar' ? 'عنوان الدرس قصير جداً (3 أحرف على الأقل)' : 'Lesson title is too short (at least 3 characters)', true);
    return;
  }
  if (icon.length === 0 || icon.length > 5) {
    showToast(currentLang === 'ar' ? 'الرجاء إدخال رمز تعبيري (إيموجي) صحيح' : 'Please provide a valid emoji icon', true);
    return;
  }
  if (videoUrl !== '' && !videoUrl.startsWith('http://') && !videoUrl.startsWith('https://')) {
    showToast(currentLang === 'ar' ? 'الرجاء إدخال رابط فيديو صحيح يبدأ بـ http أو https' : 'Please provide a valid video URL starting with http or https', true);
    return;
  }
  if (description.length < 10) {
    showToast(currentLang === 'ar' ? 'الوصف الموجز يجب أن يكون 10 أحرف على الأقل' : 'Short description must be at least 10 characters', true);
    return;
  }
  if (content.length < 10) {
    showToast(currentLang === 'ar' ? 'محتوى الشرح التفصيلي يجب أن يكون 10 أحرف على الأقل' : 'Detailed content must be at least 10 characters', true);
    return;
  }

  const newLesson = {
    title,
    icon,
    videoUrl,
    grade: gradeEl.value,
    subject: subjectEl.value,
    description,
    content,
    likes: 0,
    createdAt: Date.now()
  };

  if (db) {
    try {
      await addDoc(collection(db, "korasty_lessons"), newLesson);
      showToast(currentLang === 'ar' ? 'تم نشر الدرس بنجاح عبر السحابة! ☁️' : 'Lesson published successfully to the cloud! ☁️');
    } catch (e) {
      console.warn("Firestore lesson add failed. Local fallback used.", e);
      lessons.unshift({ id: `local-lesson-${Date.now()}`, ...newLesson });
      renderLessons();
      renderAdminLessonsList();
      saveLocalFallback();
    }
  } else {
    lessons.unshift({ id: `local-lesson-${Date.now()}`, ...newLesson });
    renderLessons();
    renderAdminLessonsList();
    saveLocalFallback();
  }

  // Reset form
  event.target.reset();
  if (iconEl) iconEl.value = '📖';

  closeAdminModal();
};

window.handleAddBook = async function(event) {
  event.preventDefault();

  const titleEl = document.getElementById('bookTitleInput');
  const urlEl = document.getElementById('bookUrlInput');
  const gradeEl = document.getElementById('bookGradeInput');
  const iconEl = document.getElementById('bookIconInput');

  if (!titleEl || !urlEl || !gradeEl || !iconEl) return;

  const title = titleEl.value.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const url = urlEl.value.trim();
  const icon = iconEl.value.trim();

  // Strict Client-Side Input Validations
  if (title.length < 3) {
    showToast(currentLang === 'ar' ? 'عنوان الكتاب قصير جداً (3 أحرف على الأقل)' : 'Book title is too short (at least 3 characters)', true);
    return;
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    showToast(currentLang === 'ar' ? 'الرجاء إدخال رابط PDF صحيح يبدأ بـ http أو https' : 'Please provide a valid PDF URL starting with http or https', true);
    return;
  }
  if (icon.length === 0 || icon.length > 5) {
    showToast(currentLang === 'ar' ? 'الرجاء إدخال رمز تعبيري (إيموجي) صحيح للكتاب' : 'Please provide a valid emoji icon for the book', true);
    return;
  }

  const newBook = {
    title,
    url,
    grade: gradeEl.value,
    icon,
    createdAt: Date.now()
  };

  if (db) {
    try {
      await addDoc(collection(db, "korasty_books"), newBook);
      showToast(currentLang === 'ar' ? 'تمت إضافة الكتاب للمكتبة بنجاح! 📚' : 'Book added to library successfully! 📚');
    } catch (e) {
      console.warn("Firestore book add failed. Local fallback used.", e);
      books.unshift({ id: `local-book-${Date.now()}`, ...newBook });
      renderBooks();
      saveLocalFallback();
    }
  } else {
    books.unshift({ id: `local-book-${Date.now()}`, ...newBook });
    renderBooks();
    saveLocalFallback();
  }

  event.target.reset();
  if (iconEl) iconEl.value = '📕';
};

window.deleteLesson = async function(id) {
  if (!confirm(currentLang === 'ar' ? 'هل أنت متأكد من رغبتك في حذف هذا الدرس نهائياً؟' : 'Are you sure you want to delete this lesson?')) return;

  if (db && !id.startsWith('local-')) {
    try {
      await deleteDoc(doc(db, "korasty_lessons", id));
      showToast(currentLang === 'ar' ? 'تم حذف الدرس بنجاح! 🗑️' : 'Lesson deleted successfully! 🗑️');
    } catch (e) {
      console.error("Firestore delete failed:", e);
      showToast(currentLang === 'ar' ? 'فشل الحذف من السحابة' : 'Failed to delete from cloud', true);
    }
  } else {
    lessons = lessons.filter(l => l.id !== id);
    renderLessons();
    renderAdminLessonsList();
    saveLocalFallback();
    showToast(currentLang === 'ar' ? 'تم حذف الدرس محلياً' : 'Lesson deleted locally');
  }
};

// Educational Games - Match and Star Quiz Challenge
let currentGameScore = 0;
let currentQuizIndex = 0;

const quizQuestions = [
  {
    q: "ما هي الكلمة التي تبدأ بحرف الألف في الأسفل؟ / Which word starts with the letter Alif?",
    options: ["تُفَّاحة 🍎", "أَسَد 🦁", "بَطَّة 🦆"],
    answer: 1
  },
  {
    q: "What is 'Cat' in Arabic language?",
    options: ["كَلْب / Dog", "قِطَّة / Cat", "عُصْفُور / Bird"],
    answer: 1
  },
  {
    q: "ما هو الحرف الإنجليزي الذي يبدأ به اسم النملة (Ant)؟",
    options: ["A", "B", "C"],
    answer: 0
  }
];

// Spelling Bee game questions and configuration
const spellingQuestions = [
  { emoji: "🦁", correct: "LION", options: ["LION", "LOIN", "LEON"] },
  { emoji: "🚀", correct: "ROCKET", options: ["ROCKET", "ROCET", "ROKIT"] },
  { emoji: "🎈", correct: "BALLOON", options: ["BALON", "BALLOON", "BALLON"] },
  { emoji: "🧁", correct: "CUPCAKE", options: ["CUPCAK", "CUPCAKE", "COPCAKE"] },
  { emoji: "🦖", correct: "DINOSAUR", options: ["DINOSOR", "DINOSAUR", "DINASOUR"] }
];
let currentSpellingIndex = 0;
let spellingScore = 0;

// Memory Sound Piano game configuration
let soundSequence = [];
let soundUserStep = 0;
let soundLevel = 1;
const soundButtonsConfig = [
  { id: 'red', colorClass: 'bg-rose-500 active:bg-rose-700', borderClass: 'border-rose-600', note: 261.63, emoji: '🔴' },
  { id: 'yellow', colorClass: 'bg-amber-400 active:bg-amber-600', borderClass: 'border-amber-500', note: 329.63, emoji: '🟡' },
  { id: 'blue', colorClass: 'bg-sky-500 active:bg-sky-700', borderClass: 'border-sky-600', note: 392.00, emoji: '🔵' },
  { id: 'green', colorClass: 'bg-emerald-500 active:bg-emerald-700', borderClass: 'border-emerald-600', note: 523.25, emoji: '🟢' }
];

window.openGameModal = function(gameType) {
  const modal = document.getElementById('gameModal');
  const titleEl = document.getElementById('gameModalTitle');
  const bodyEl = document.getElementById('gameModalBody');

  if (!modal || !titleEl || !bodyEl) return;

  if (gameType === 'match') {
    titleEl.innerHTML = currentLang === 'ar' ? '🧩 لعبة مطابقة الحروف والكلمات' : '🧩 Letter & Word Matching Game';
    bodyEl.innerHTML = `
      <div class="text-center p-4">
        <p class="mb-6 text-lg font-bold text-gray-700">
          ${currentLang === 'ar' ? 'اختر الكلمة الصحيحة التي تبدأ بحرف (ب):' : 'Choose the correct word starting with letter (B):'}
        </p>
        <div class="text-7xl font-extrabold text-indigo-600 mb-8 animate-bounce">ب</div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <button onclick="checkGameAnswer(false)" class="p-5 bg-white border-2 border-gray-100 hover:border-red-400 rounded-2xl font-bold text-lg text-slate-800 transition-all hover:scale-105">تفاحة 🍎</button>
          <button onclick="checkGameAnswer(true)" class="p-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-md transition-all hover:scale-105">بطة 🦆</button>
          <button onclick="checkGameAnswer(false)" class="p-5 bg-white border-2 border-gray-100 hover:border-red-400 rounded-2xl font-bold text-lg text-slate-800 transition-all hover:scale-105">أسد 🦁</button>
        </div>
        <div id="gameFeedback" class="font-bold text-xl min-h-[2.5rem]"></div>
      </div>
    `;
  } else if (gameType === 'quiz') {
    currentQuizIndex = 0;
    currentGameScore = 0;
    renderQuizQuestion();
  } else if (gameType === 'spelling') {
    titleEl.innerHTML = currentLang === 'ar' ? '🐝 نحلة التهجئة الذكية' : '🐝 Spelling Bee Arena';
    startSpellingGame();
  } else if (gameType === 'sound') {
    titleEl.innerHTML = currentLang === 'ar' ? '🎹 بيانو الذاكرة السمعية' : '🎹 Memory Sound Piano';
    startSoundGame();
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

// --- Spelling Bee Core Logic ---
window.startSpellingGame = function() {
  currentSpellingIndex = 0;
  spellingScore = 0;
  renderSpellingQuestion();
};

window.renderSpellingQuestion = function() {
  const bodyEl = document.getElementById('gameModalBody');
  if (!bodyEl) return;

  if (currentSpellingIndex >= spellingQuestions.length) {
    bodyEl.innerHTML = `
      <div class="text-center p-6 flex flex-col items-center gap-4">
        <div class="text-6xl animate-bounce">🐝🏆</div>
        <h4 class="text-xl font-bold text-pink-600">${currentLang === 'ar' ? 'أحسنت يا بطل التهجئة!' : 'Outstanding, Spelling Hero!'}</h4>
        <p class="text-sm text-slate-600">${currentLang === 'ar' ? `لقد حصلت على ${spellingScore} من أصل 5 نجوم!` : `You got ${spellingScore} out of 5 stars!`}</p>
        <button onclick="closeGameModal()" class="px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer">
          ${currentLang === 'ar' ? 'الخروج والعودة' : 'Exit Game'}
        </button>
      </div>
    `;
    return;
  }

  const q = spellingQuestions[currentSpellingIndex];
  bodyEl.innerHTML = `
    <div class="text-center p-2 flex flex-col gap-4">
      <div class="flex justify-between items-center text-xs font-bold text-slate-400">
        <span>${currentLang === 'ar' ? 'تحدي نحلة التهجئة' : 'Spelling Bee Challenge'}</span>
        <span>${currentSpellingIndex + 1} / 5</span>
      </div>
      <div class="text-6xl my-2 select-none animate-pulse">${q.emoji}</div>
      <p class="text-sm font-extrabold text-slate-700">${currentLang === 'ar' ? 'اختر الكلمة بالتهجئة الإنجليزية الصحيحة:' : 'Choose the correct English spelling:'}</p>
      <div class="grid grid-cols-1 gap-2.5 max-w-sm mx-auto w-full">
        ${q.options.map(opt => `
          <button onclick="selectSpellingAnswer('${opt}', '${q.correct}')" class="p-4 bg-slate-50 hover:bg-pink-50 border border-slate-200 hover:border-pink-300 rounded-xl font-black text-slate-800 text-sm transition-all hover:scale-[1.01] cursor-pointer">
            ${opt}
          </button>
        `).join('')}
      </div>
    </div>
  `;
};

window.selectSpellingAnswer = function(chosen, correct) {
  if (chosen === correct) {
    spellingScore++;
    playSuccessSound();
    showToast(currentLang === 'ar' ? 'تهجئة صحيحة ورائعة! 🐝✨' : 'Awesome, perfect spelling! 🐝✨');
  } else {
    playErrorSound();
    showToast(currentLang === 'ar' ? `أوبس! الكلمة الصحيحة هي ${correct}` : `Oops! Correct spelling is ${correct}`, true);
  }
  currentSpellingIndex++;
  setTimeout(() => {
    renderSpellingQuestion();
  }, 1200);
};

// --- Memory Sound Piano Core Logic ---
window.startSoundGame = function() {
  soundSequence = [];
  soundUserStep = 0;
  soundLevel = 1;
  nextSoundLevel();
};

window.nextSoundLevel = function() {
  soundUserStep = 0;
  // Add a random note index (0-3)
  const randomBtn = Math.floor(Math.random() * 4);
  soundSequence.push(randomBtn);
  
  // Render disabled board first so the user does not tap during audio demo
  renderSoundBoard(true);
  
  // Play sequence visually & audibly
  setTimeout(() => {
    playSequence();
  }, 500);
};

function playSequence() {
  let i = 0;
  const interval = setInterval(() => {
    if (i >= soundSequence.length) {
      clearInterval(interval);
      // Re-enable inputs
      renderSoundBoard(false);
      return;
    }
    const btnIndex = soundSequence[i];
    highlightSoundButton(btnIndex);
    i++;
  }, 750);
}

window.highlightSoundButton = function(btnIndex) {
  const btnConfig = soundButtonsConfig[btnIndex];
  playCustomPianoNote(btnConfig.note);
  
  const el = document.getElementById(`sound-btn-${btnIndex}`);
  if (el) {
    el.classList.add('brightness-150', 'scale-[1.05]');
    setTimeout(() => {
      el.classList.remove('brightness-150', 'scale-[1.05]');
    }, 350);
  }
};

window.handleSoundButtonClick = function(btnIndex) {
  highlightSoundButton(btnIndex);
  
  if (btnIndex === soundSequence[soundUserStep]) {
    soundUserStep++;
    if (soundUserStep === soundSequence.length) {
      soundLevel++;
      showToast(currentLang === 'ar' ? `رائع للغاية! استعد للمستوى ${soundLevel} 🎉` : `Perfect! Get ready for Level ${soundLevel} 🎉`);
      setTimeout(() => {
        nextSoundLevel();
      }, 1200);
    }
  } else {
    playErrorSound();
    const bodyEl = document.getElementById('gameModalBody');
    if (bodyEl) {
      bodyEl.innerHTML = `
        <div class="text-center p-6 flex flex-col items-center gap-4">
          <div class="text-5xl">🛑🎹</div>
          <h4 class="text-xl font-bold text-rose-600">${currentLang === 'ar' ? 'أوبس! لقد أخطأت الترتيب' : 'Oops! Wrong Note'}</h4>
          <p class="text-sm text-slate-600">
            ${currentLang === 'ar' ? `لقد تمكنت من الوصول للمستوى رقم ${soundLevel}!` : `You successfully achieved Level ${soundLevel}!`}
          </p>
          <button onclick="startSoundGame()" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer hover:scale-105">
            ${currentLang === 'ar' ? 'إعادة المحاولة 🔄' : 'Try Again 🔄'}
          </button>
        </div>
      `;
    }
  }
};

window.renderSoundBoard = function(isDisabled) {
  const bodyEl = document.getElementById('gameModalBody');
  if (!bodyEl) return;
  
  bodyEl.innerHTML = `
    <div class="text-center p-2 flex flex-col gap-3">
      <div class="flex justify-between items-center text-xs font-bold text-slate-400">
        <span>${currentLang === 'ar' ? 'بيانو الذاكرة السمعية' : 'Memory Sound Piano'}</span>
        <span class="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">${currentLang === 'ar' ? 'المستوى' : 'Level'} ${soundLevel}</span>
      </div>
      <p class="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
        ${isDisabled 
          ? (currentLang === 'ar' ? '🎧 استمع للنغمات الموسيقية والألوان بدقة الآن...' : '🎧 Listen to the musical notes closely now...') 
          : (currentLang === 'ar' ? '👉 الآن! اضغط على الأزرار بنفس الترتيب الذي سمعته:' : '👉 Now! Press the colors in the exact same sequence:')}
      </p>
      
      <div class="grid grid-cols-2 gap-4 max-w-xs mx-auto w-full my-4">
        ${soundButtonsConfig.map((cfg, idx) => `
          <button id="sound-btn-${idx}" 
                  ${isDisabled ? 'disabled' : ''} 
                  onclick="handleSoundButtonClick(${idx})" 
                  class="h-24 rounded-2xl border-4 ${cfg.borderClass} ${cfg.colorClass} text-white font-bold text-xl flex flex-col items-center justify-center transition-all ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-102 active:scale-95 shadow-sm'}">
            <span>${cfg.emoji}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
};

function playCustomPianoNote(frequency) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'triangle'; // Sweet piano synth
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) {
    console.log("Audio piano play blocked:", e);
  }
}

window.closeGameModal = function() {
  const modal = document.getElementById('gameModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

window.checkGameAnswer = function(isCorrect) {
  const feedback = document.getElementById('gameFeedback');
  if (!feedback) return;

  if (isCorrect) {
    feedback.style.color = '#10b981';
    feedback.innerHTML = `🎉 ${currentLang === 'ar' ? 'إجابة صحيحة رائعة! أحسنت يا بطل!' : 'Excellent! Correct answer, little hero!'}`;
    playSuccessSound();
    setTimeout(() => {
      closeGameModal();
      showToast(currentLang === 'ar' ? '🌟 حصلت على نقطة تميز جديدة!' : '🌟 Earned a new star!');
    }, 2000);
  } else {
    feedback.style.color = '#ef4444';
    feedback.innerHTML = `❌ ${currentLang === 'ar' ? 'حاول مرة أخرى، أنت تستطيع!' : 'Try again, you can do it!'}`;
    playErrorSound();
  }
};

window.renderQuizQuestion = function() {
  const bodyEl = document.getElementById('gameModalBody');
  const titleEl = document.getElementById('gameModalTitle');

  if (!bodyEl || !titleEl) return;

  titleEl.innerHTML = currentLang === 'ar' ? `⭐ تحدي النجوم (${currentQuizIndex + 1}/3)` : `⭐ Star Challenge (${currentQuizIndex + 1}/3)`;

  if (currentQuizIndex >= quizQuestions.length) {
    bodyEl.innerHTML = `
      <div class="text-center p-8">
        <div class="text-6xl mb-4 animate-pulse">🏆</div>
        <h3 class="text-2xl font-extrabold text-indigo-700 mb-2">
          ${currentLang === 'ar' ? 'لقد أكملت التحدي بنجاح!' : 'You completed the challenge successfully!'}
        </h3>
        <p class="text-lg text-gray-600 mb-6">
          ${currentLang === 'ar' ? `مجموع درجاتك: ${currentGameScore} من 3 نجوم ⭐` : `Your total score: ${currentGameScore} out of 3 stars ⭐`}
        </p>
        <button onclick="closeGameModal()" class="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition-all">
          ${currentLang === 'ar' ? 'العودة للمنصة 🎯' : 'Go back to Platform 🎯'}
        </button>
      </div>
    `;
    return;
  }

  const qObj = quizQuestions[currentQuizIndex];
  bodyEl.innerHTML = `
    <div class="text-center">
      <p class="mb-6 text-xl font-bold text-gray-800">${qObj.q}</p>
      <div class="flex flex-col gap-3 max-w-md mx-auto">
        ${qObj.options.map((opt, idx) => `
          <button onclick="submitQuizChoice(${idx}, ${qObj.answer})" class="p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-2xl font-bold text-slate-800 transition-all text-base">
            ${opt}
          </button>
        `).join('')}
      </div>
    </div>
  `;
};

window.submitQuizChoice = function(chosen, correct) {
  if (chosen === correct) {
    currentGameScore++;
    playSuccessSound();
    showToast(currentLang === 'ar' ? 'إجابة صحيحة وممتازة! ✨' : 'Excellent, correct! ✨');
  } else {
    playErrorSound();
    showToast(currentLang === 'ar' ? 'حاول مجدداً في السؤال القادم!' : 'Try again on the next question!', true);
  }
  currentQuizIndex++;
  renderQuizQuestion();
};

// Web Audio API Sound Synthesizers for device audio output (avoids loading slow or missing media files)
function playSuccessSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {
    console.log("Audio play blocked or unsupported:", e);
  }
}

function playErrorSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
    osc.frequency.setValueAtTime(147, ctx.currentTime + 0.15); // D3
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) {
    console.log("Audio play blocked or unsupported:", e);
  }
}

// Sister Platforms Promotional Ads Function with interactive modal alerts
window.openExternalAdModal = function(platformKey) {
  const modal = document.getElementById('externalAdModal');
  const titleEl = document.getElementById('adModalTitle');
  const bodyEl = document.getElementById('adModalContentBody');
  const headerBg = document.getElementById('adModalHeaderBg');

  if (!modal || !titleEl || !bodyEl || !headerBg) return;

  if (platformKey === 'codepulse') {
    titleEl.innerText = currentLang === 'ar' ? '⚡ منصة CodePulse البرمجية' : '⚡ CodePulse Platform';
    headerBg.className = "modal-header p-6 flex justify-between items-center text-white bg-gradient-to-r from-slate-900 to-indigo-900";
    bodyEl.innerHTML = `
      <div class="text-center p-4">
        <div class="mb-6 inline-block bg-white/10 p-4 rounded-3xl">
          <img src="https://portalcodingstudio.ai.studio/codepulse-logo.png" alt="CodePulse Logo" class="h-16 object-contain" onerror="this.src='https://portalcodingstudio.ai.studio/icon.png';">
        </div>
        <h4 class="text-lg font-bold text-indigo-900 mb-3">
          ${currentLang === 'ar' ? 'الوجهة الأولى للمطورين ومبتكري المستقبل' : 'The Ultimate Gateway for Developers & AI Builders'}
        </h4>
        <p class="text-gray-600 text-sm leading-relaxed mb-6">
          ${currentLang === 'ar' ? 'تمنحك منصة CodePulse تجارب برمجية متطورة، ألعاب خوارزميات تفاعلية ومسارات بناء ذكاء اصطناعي للجيل الجديد.' : 'CodePulse delivers cutting-edge programming labs, gamified algorithms, and next-gen artificial intelligence pathways.'}
        </p>
        <div class="flex gap-4 justify-center">
          <a href="https://portalcodingstudio.ai.studio/partner/MYNOTEBOOK?key=MYNOTEBOOK15" target="_blank" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm">
            ${currentLang === 'ar' ? 'زيارة رابط CodePulse المباشر ↗' : 'Visit CodePulse Platform ↗'}
          </a>
        </div>
      </div>
    `;
  } else if (platformKey === 'rtc') {
    titleEl.innerText = currentLang === 'ar' ? '🤖 مركز تكنولوجيا الروبوتات (RTC)' : '🤖 Robotic Technology Center (RTC)';
    headerBg.className = "modal-header p-6 flex justify-between items-center text-white bg-gradient-to-r from-pink-700 to-rose-900";
    bodyEl.innerHTML = `
      <div class="text-center p-4">
        <div class="mb-6 inline-block bg-white p-4 rounded-3xl shadow-sm border border-pink-100">
          <img src="https://robotic-tc.com/newlogo.png" alt="RTC Logo" class="h-14 object-contain" onerror="this.src='https://robotic-tc.com/newlogo-sm.png';">
        </div>
        <h4 class="text-lg font-bold text-pink-900 mb-3">
          ${currentLang === 'ar' ? 'رسم مستقبل أطفالك مع هندسة الروبوتات والذكاء الاصطناعي' : 'Shape the Future with Robotics, IoT & Smart AI'}
        </h4>
        <p class="text-gray-600 text-sm leading-relaxed mb-6">
          ${currentLang === 'ar' ? 'مركز RTC هو المنصة المتكاملة لتعلم تصميم الروبوتات، إنترنت الأشياء والذكاء الاصطناعي بطرق شيقة وعملية.' : 'RTC is the leading academy for teaching kids and teens hardware engineering, embedded systems, robotics, and smart systems.'}
        </p>
        <div class="flex gap-4 justify-center">
          <a href="https://robotic-tc.com" target="_blank" class="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm">
            ${currentLang === 'ar' ? 'زيارة موقع RTC الرسمي ↗' : 'Visit Official RTC Site ↗'}
          </a>
        </div>
      </div>
    `;
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeExternalAdModal = function() {
  const modal = document.getElementById('externalAdModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

function showToast(message, isError = false) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'error border-rose-500' : 'success border-emerald-500'} bg-white text-slate-800 shadow-xl border-l-4 p-4 rounded-xl flex items-center gap-3 transition-all duration-300 transform translate-x-12 opacity-0`;
  toast.innerHTML = `
    <span class="text-xl">${isError ? '⚠️' : '✨'}</span>
    <span class="font-bold text-sm text-slate-700">${message}</span>
  `;

  container.appendChild(toast);

  // Trigger entering transition
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  }, 10);

  // Auto-remove toast
  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// Global Search Event Hook & Quiz Initialization
document.addEventListener('DOMContentLoaded', () => {
  const sInput = document.getElementById('searchInput');
  if (sInput) {
    sInput.addEventListener('input', () => {
      renderLessons();
    });
  }

  // Keyboard navigation accessibility: Press 'Escape' key to close active modals
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeLessonModal();
      closeGameModal();
      closeExternalAdModal();
      closeAdminModal();
      closePasswordModal();
    }
  });

  // Ensure quiz is reset to start state initially
  resetBuiltInQuiz();
});

// ==========================================
// 📝 MULTI-SUBJECT INTERACTIVE LEVEL TESTS
// ==========================================
let currentTestType = 'english';

const englishQuizQuestions = [
  {
    emoji: "🍎",
    questionEn: "What is this fruit called?",
    questionAr: "ما اسم هذه الفاكهة بالإنجليزية؟",
    options: [
      { textEn: "Banana", textAr: "موز", isCorrect: false },
      { textEn: "Orange", textAr: "برتقال", isCorrect: false },
      { textEn: "Apple", textAr: "تفاح", isCorrect: true },
      { textEn: "Grape", textAr: "عنب", isCorrect: false }
    ]
  },
  {
    emoji: "🐱",
    questionEn: "The cute cat is sitting ______ the cozy box.",
    questionAr: "القطة الجميلة تجلس ______ الصندوق الدافئ.",
    options: [
      { textEn: "under", textAr: "تحت", isCorrect: false },
      { textEn: "inside", textAr: "داخل", isCorrect: true },
      { textEn: "on top of", textAr: "فوق", isCorrect: false },
      { textEn: "behind", textAr: "خلف", isCorrect: false }
    ]
  },
  {
    emoji: "🏃",
    questionEn: "He ______ to school early every single morning.",
    questionAr: "هو ______ إلى المدرسة مبكراً كل صباح.",
    options: [
      { textEn: "go", textAr: "يذهب (go)", isCorrect: false },
      { textEn: "goes", textAr: "يذهب (goes)", isCorrect: true },
      { textEn: "going", textAr: "يذهب (going)", isCorrect: false },
      { textEn: "went", textAr: "ذهب", isCorrect: false }
    ]
  },
  {
    emoji: "🦖",
    questionEn: "Yesterday, the brave children ______ a massive dinosaur bones model.",
    questionAr: "بالأمس، الأطفال الشجعان ______ نموذج عظام ديناصور ضخم.",
    options: [
      { textEn: "saw", textAr: "رأوا", isCorrect: true },
      { textEn: "see", textAr: "يرون", isCorrect: false },
      { textEn: "seeing", textAr: "رؤية", isCorrect: false },
      { textEn: "sees", textAr: "يرى", isCorrect: false }
    ]
  },
  {
    emoji: "🦋",
    questionEn: "Which word starts with the letter 'B'?",
    questionAr: "أي كلمة تبدأ بحرف الـ 'B'؟",
    options: [
      { textEn: "Elephant", textAr: "فيل", isCorrect: false },
      { textEn: "Lion", textAr: "أسد", isCorrect: false },
      { textEn: "Butterfly", textAr: "فراشة", isCorrect: true },
      { textEn: "Giraffe", textAr: "زرافة", isCorrect: false }
    ]
  },
  {
    emoji: "🏫",
    questionEn: "Choose the correct spelling:",
    questionAr: "اختر الهجاء الصحيح للكلمة:",
    options: [
      { textEn: "Scool", textAr: "مدرسة خاطئة", isCorrect: false },
      { textEn: "School", textAr: "مدرسة صحيحة", isCorrect: true },
      { textEn: "Shool", textAr: "مدرسة خاطئة", isCorrect: false },
      { textEn: "Schol", textAr: "مدرسة خاطئة", isCorrect: false }
    ]
  },
  {
    emoji: "🦕",
    questionEn: "Dinosaurs lived millions of years ago. They are now ______.",
    questionAr: "عاشت الديناصورات قبل ملايين السنين. إنها الآن ______.",
    options: [
      { textEn: "extinct", textAr: "منقرضة", isCorrect: true },
      { textEn: "happy", textAr: "سعيدة", isCorrect: false },
      { textEn: "small", textAr: "صغيرة", isCorrect: false },
      { textEn: "extincted", textAr: "منقرضة خاطئة", isCorrect: false }
    ]
  },
  {
    emoji: "🚀",
    questionEn: "This rocket is the ______ one in the universe!",
    questionAr: "هذا الصاروخ هو ______ واحد في الكون!",
    options: [
      { textEn: "fast", textAr: "سريع", isCorrect: false },
      { textEn: "faster", textAr: "أسرع", isCorrect: false },
      { textEn: "fastest", textAr: "الأسرع", isCorrect: true },
      { textEn: "fastly", textAr: "بسرعة", isCorrect: false }
    ]
  }
];

const mathQuizQuestions = [
  {
    emoji: "➕",
    questionEn: "What is 3 + 4?",
    questionAr: "كم ناتج جمع 3 + 4؟",
    options: [
      { textEn: "5", textAr: "5", isCorrect: false },
      { textEn: "6", textAr: "6", isCorrect: false },
      { textEn: "7", textAr: "7", isCorrect: true },
      { textEn: "8", textAr: "8", isCorrect: false }
    ]
  },
  {
    emoji: "🍎",
    questionEn: "If you have 5 apples and you eat 2, how many are left?",
    questionAr: "إذا كان معك 5 تفاحات وأكلت منها تفاحتين، كم يتبقى معك؟",
    options: [
      { textEn: "2", textAr: "2", isCorrect: false },
      { textEn: "3", textAr: "3", isCorrect: true },
      { textEn: "4", textAr: "4", isCorrect: false },
      { textEn: "5", textAr: "5", isCorrect: false }
    ]
  },
  {
    emoji: "✖️",
    questionEn: "What is 2 x 5?",
    questionAr: "كم ناتج ضرب 2 في 5؟",
    options: [
      { textEn: "8", textAr: "8", isCorrect: false },
      { textEn: "10", textAr: "10", isCorrect: true },
      { textEn: "12", textAr: "12", isCorrect: false },
      { textEn: "15", textAr: "15", isCorrect: false }
    ]
  },
  {
    emoji: "🍕",
    questionEn: "Half of a pizza has how many slices if a whole pizza has 8 slices?",
    questionAr: "نصف البيتزا يحتوي على كم قطعة إذا كانت البيتزا كاملة تحتوي على 8 قطع؟",
    options: [
      { textEn: "2", textAr: "2", isCorrect: false },
      { textEn: "3", textAr: "3", isCorrect: false },
      { textEn: "4", textAr: "4", isCorrect: true },
      { textEn: "6", textAr: "6", isCorrect: false }
    ]
  },
  {
    emoji: "🔢",
    questionEn: "What number comes next? 2, 4, 6, 8, ___",
    questionAr: "ما هو الرقم التالي في النمط؟ 2، 4، 6، 8، ___",
    options: [
      { textEn: "9", textAr: "9", isCorrect: false },
      { textEn: "10", textAr: "10", isCorrect: true },
      { textEn: "11", textAr: "11", isCorrect: false },
      { textEn: "12", textAr: "12", isCorrect: false }
    ]
  },
  {
    emoji: "🔺",
    questionEn: "How many sides does a triangle have?",
    questionAr: "كم عدد أضلاع المثلث؟",
    options: [
      { textEn: "3", textAr: "3", isCorrect: true },
      { textEn: "4", textAr: "4", isCorrect: false },
      { textEn: "5", textAr: "5", isCorrect: false },
      { textEn: "6", textAr: "6", isCorrect: false }
    ]
  },
  {
    emoji: "🕒",
    questionEn: "What time is it if the big hand is on 12 and the small hand is on 9?",
    questionAr: "كم تكون الساعة إذا كان عقرب الدقائق على 12 وعقرب الساعات على 9؟",
    options: [
      { textEn: "12:00", textAr: "الساعة 12:00", isCorrect: false },
      { textEn: "3:00", textAr: "الساعة 3:00", isCorrect: false },
      { textEn: "9:00", textAr: "الساعة 9:00", isCorrect: true },
      { textEn: "6:00", textAr: "الساعة 6:00", isCorrect: false }
    ]
  },
  {
    emoji: "🐸",
    questionEn: "If 1 frog has 4 legs, how many legs do 2 frogs have?",
    questionAr: "إذا كان للضفدع الواحد 4 أرجل، فكم رجلاً لضفدعين؟",
    options: [
      { textEn: "4", textAr: "4 أرجل", isCorrect: false },
      { textEn: "6", textAr: "6 أرجل", isCorrect: false },
      { textEn: "8", textAr: "8 أرجل", isCorrect: true },
      { textEn: "10", textAr: "10 أرجل", isCorrect: false }
    ]
  }
];

const arabicQuizQuestions = [
  {
    emoji: "🦁",
    questionEn: "What is the name of this animal in Arabic?",
    questionAr: "ما اسم هذا الحيوان في الصورة؟",
    options: [
      { textEn: "Tiger", textAr: "نمر", isCorrect: false },
      { textEn: "Cheetah", textAr: "فهد", isCorrect: false },
      { textEn: "Lion", textAr: "أسد", isCorrect: true },
      { textEn: "Wolf", textAr: "ذئب", isCorrect: false }
    ]
  },
  {
    emoji: "✍️",
    questionEn: "Which letter does the word 'تفاحة' (Apple) start with?",
    questionAr: "أي حرف تبدأ به كلمة 'تفاحة'؟",
    options: [
      { textEn: "Alif (أ)", textAr: "أ", isCorrect: false },
      { textEn: "Ba (ب)", textAr: "ب", isCorrect: false },
      { textEn: "Ta (ت)", textAr: "ت", isCorrect: true },
      { textEn: "Jeem (ج)", textAr: "ج", isCorrect: false }
    ]
  },
  {
    emoji: "☀️",
    questionEn: "What is the opposite word of 'نهار' (Daytime)?",
    questionAr: "ما الكلمة المضادة لـ 'نهار'؟",
    options: [
      { textEn: "Evening (مساء)", textAr: "مساء", isCorrect: false },
      { textEn: "Sun (شمس)", textAr: "شمس", isCorrect: false },
      { textEn: "Night (ليل)", textAr: "ليل", isCorrect: true },
      { textEn: "Morning (صباح)", textAr: "صباح", isCorrect: false }
    ]
  },
  {
    emoji: "🌳",
    questionEn: "What is the correct demonstrative pronoun for 'شجرة' (Tree)?",
    questionAr: "اسم الإشارة المناسب لـ 'شجرة' هو:",
    options: [
      { textEn: "Hatha (هذا)", textAr: "هذا", isCorrect: false },
      { textEn: "Hathihi (هذه)", textAr: "هذه", isCorrect: true },
      { textEn: "Hathan (هذان)", textAr: "هذان", isCorrect: false },
      { textEn: "Haola (هؤلاء)", textAr: "هؤلاء", isCorrect: false }
    ]
  },
  {
    emoji: "🖊️",
    questionEn: "What is the plural of 'قلم' (Pen)?",
    questionAr: "ما جمع كلمة 'قلم'؟",
    options: [
      { textEn: "Aqlam (أقلام)", textAr: "أقلام", isCorrect: true },
      { textEn: "Qalamoon (قلمون)", textAr: "قلمون", isCorrect: false },
      { textEn: "Qalamat (قلمات)", textAr: "قلمات", isCorrect: false },
      { textEn: "Qalamayn (قلمين)", textAr: "قلمين", isCorrect: false }
    ]
  },
  {
    emoji: "🥛",
    questionEn: "Which of these words ends with a 'تاء مربوطة' (ة)?",
    questionAr: "أي كلمة من الكلمات التالية تنتهي بتاء مربوطة (ة)؟",
    options: [
      { textEn: "Bint (بنت)", textAr: "بنت", isCorrect: false },
      { textEn: "Madrasah (مدرسة)", textAr: "مدرسة", isCorrect: true },
      { textEn: "Bayt (بيت)", textAr: "بيت", isCorrect: false },
      { textEn: "Sareer (سرير)", textAr: "سرير", isCorrect: false }
    ]
  },
  {
    emoji: "🐪",
    questionEn: "The word 'جمل' (Camel) starts with the letter:",
    questionAr: "كلمة 'جمل' تبدأ بحرف الـ:",
    options: [
      { textEn: "Alif (أ)", textAr: "أ", isCorrect: false },
      { textEn: "Jeem (ج)", textAr: "ج", isCorrect: true },
      { textEn: "Kha (خ)", textAr: "خ", isCorrect: false },
      { textEn: "Dal (د)", textAr: "د", isCorrect: false }
    ]
  },
  {
    emoji: "🎨",
    questionEn: "What is the color of the clear sky during the day?",
    questionAr: "ما لون السماء الصافية في النهار؟",
    options: [
      { textEn: "Red (أحمر)", textAr: "أحمر", isCorrect: false },
      { textEn: "Green (أخضر)", textAr: "أخضر", isCorrect: false },
      { textEn: "Blue (أزرق)", textAr: "أزرق", isCorrect: true },
      { textEn: "Yellow (أصفر)", textAr: "أصفر", isCorrect: false }
    ]
  }
];

let quizCurrentIndex = 0;
let quizScore = 0;

window.switchTestType = function(type) {
  currentTestType = type;
  
  // Update Tabs Styling
  const tabs = ['english', 'math', 'arabic'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tab-btn-${t}`);
    if (btn) {
      if (t === type) {
        btn.className = "tab-btn px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm";
      } else {
        btn.className = "tab-btn px-4 py-1.5 bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-xs font-bold transition-all cursor-pointer";
      }
    }
  });

  // Update Welcome Text dynamically based on Subject
  const descAr = document.getElementById('quizStartDescAr');
  const descEn = document.getElementById('quizStartDescEn');
  
  if (descAr && descEn) {
    if (type === 'english') {
      descAr.innerText = "مستعد لمعرفة مستواك في اللغة الإنجليزية؟ أجب على 8 أسئلة لغوية تفاعلية سريعة واحصل على تقييم وشهادة فورية!";
      descEn.innerText = "Ready to check your English level? Answer 8 quick interactive language questions and receive your verified certificate level!";
    } else if (type === 'math') {
      descAr.innerText = "مستعد لاختبار مهاراتك الحسابية والذهنية؟ أجب على 8 أسئلة ممتعة في الرياضيات واحصل على تقييم وشهادة فورية!";
      descEn.innerText = "Ready to check your mathematics and analytical skills? Answer 8 fun interactive math questions and receive your verified competency certificate!";
    } else if (type === 'arabic') {
      descAr.innerText = "مستعد لاختبار مهاراتك في اللغة العربية الفصحى؟ أجب على 8 أسئلة تفاعلية رائعة واحصل على تقييم وشهادة فورية!";
      descEn.innerText = "Ready to test your Arabic grammar, spelling and vocabulary skills? Answer 8 quick interactive questions and receive your verified proficiency certificate!";
    }
  }

  resetBuiltInQuiz();
};

window.startBuiltInQuiz = function() {
  quizCurrentIndex = 0;
  quizScore = 0;
  
  document.getElementById('quizStartState').classList.add('hidden');
  document.getElementById('quizEndState').classList.add('hidden');
  document.getElementById('quizPlayState').classList.remove('hidden');
  
  renderQuizQuestion();
};

window.renderQuizQuestion = function() {
  const questionsList = currentTestType === 'english' ? englishQuizQuestions : (currentTestType === 'math' ? mathQuizQuestions : arabicQuizQuestions);
  const currentQ = questionsList[quizCurrentIndex];
  
  // Set question number and score
  document.getElementById('quizCurrentProgress').innerText = (quizCurrentIndex + 1).toString();
  document.getElementById('quizCurrentScore').innerText = quizScore.toString();
  
  // Set question values
  document.getElementById('quizQuestionEmoji').innerText = currentQ.emoji;
  
  if (currentLang === 'ar') {
    document.getElementById('quizQuestionText').innerText = currentQ.questionAr;
  } else {
    document.getElementById('quizQuestionText').innerText = currentQ.questionEn;
  }
  
  // Render options grid
  const answersGrid = document.getElementById('quizAnswersGrid');
  answersGrid.innerHTML = '';
  
  currentQ.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = "p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-bold text-slate-700 text-center transition-all cursor-pointer hover:scale-[1.02] flex flex-col items-center justify-center gap-1";
    btn.onclick = () => selectQuizAnswer(opt.isCorrect);
    
    // Arabic and English labels inside option
    const textSpan = document.createElement('span');
    textSpan.innerText = currentLang === 'ar' ? opt.textAr : opt.textEn;
    btn.appendChild(textSpan);
    
    answersGrid.appendChild(btn);
  });
};

window.selectQuizAnswer = function(isCorrect) {
  if (isCorrect) {
    quizScore++;
    showToast(currentLang === 'ar' ? 'إجابة صحيحة وممتازة! 🎉' : 'Awesome, Correct Answer! 🎉');
    playTone(true);
  } else {
    showToast(currentLang === 'ar' ? 'أوه! حاول مجدداً مع الأسئلة القادمة 👍' : 'Oh, try again on the next question! 👍', true);
    playTone(false);
  }
  
  // Add slight delay for cool pacing
  setTimeout(() => {
    quizCurrentIndex++;
    const questionsList = currentTestType === 'english' ? englishQuizQuestions : (currentTestType === 'math' ? mathQuizQuestions : arabicQuizQuestions);
    if (quizCurrentIndex < questionsList.length) {
      renderQuizQuestion();
    } else {
      finishBuiltInQuiz();
    }
  }, 800);
};

window.finishBuiltInQuiz = function() {
  document.getElementById('quizPlayState').classList.add('hidden');
  document.getElementById('quizEndState').classList.remove('hidden');
  
  document.getElementById('quizFinalScore').innerText = quizScore.toString();
  
  const certTypeEl = document.getElementById('quizCertType');
  const badgeEl = document.getElementById('quizLevelBadge');
  const descEl = document.getElementById('quizLevelDesc');
  
  if (currentTestType === 'english') {
    if (certTypeEl) certTypeEl.innerText = "Certificate of English Proficiency";
    if (quizScore <= 3) {
      badgeEl.innerText = currentLang === 'ar' ? 'مبتدئ (Beginner A1) 🧸' : 'Beginner (A1) 🧸';
      descEl.innerText = currentLang === 'ar' 
        ? 'رائع كخطوة أولى! استمر في قراءة كتب الأطفال والاستماع للمقاطع الصوتية لتنمية مهاراتك!' 
        : 'Fantastic starting point! Keep reading storybooks and listening to kids songs to grow!';
    } else if (quizScore <= 6) {
      badgeEl.innerText = currentLang === 'ar' ? 'أساسي (Elementary A2) 🌟' : 'Elementary (A2) 🌟';
      descEl.innerText = currentLang === 'ar' 
        ? 'ممتاز جداً! لديك أساس قوي للكلمات والجمل البسيطة. واصل التعلم للوصول للمستوى المتقدم!' 
        : 'Wonderful job! You have a solid understanding of basic words and simple sentences. Keep up the high effort!';
    } else {
      badgeEl.innerText = currentLang === 'ar' ? 'متوسط (Intermediate B1) 🏆' : 'Intermediate (B1) 🏆';
      descEl.innerText = currentLang === 'ar' 
        ? 'مذهل ومثالي! مستواك رائع للغاية وقريب جداً من الطلاقة اللغوية. أنت بطل لغوي حقيقي!' 
        : 'Outstanding and flawless! Your level is highly proficient and nearing complete fluency. You are a real language champion!';
    }
  } else if (currentTestType === 'math') {
    if (certTypeEl) certTypeEl.innerText = "Certificate of Mathematics Competency";
    if (quizScore <= 3) {
      badgeEl.innerText = currentLang === 'ar' ? 'مبتدئ حسابي (Math Apprentice) 🧸' : 'Math Apprentice 🧸';
      descEl.innerText = currentLang === 'ar' 
        ? 'خطوة ممتازة! تدرب على عمليات الجمع والطرح البسيطة باستخدام الفواكه والألعاب لتصبح عبقرياً!' 
        : 'A great step! Practice basic addition and subtraction with toys and fruits to level up!';
    } else if (quizScore <= 6) {
      badgeEl.innerText = currentLang === 'ar' ? 'مستكشف حسابي (Math Explorer) 🌟' : 'Math Explorer 🌟';
      descEl.innerText = currentLang === 'ar' 
        ? 'عمل رائع ومميز! أنت تحل العمليات الحسابية والأنماط والأشكال الهندسية بذكاء ملحوظ!' 
        : 'Superb! You solve arithmetic equations, patterns and geometric shapes with high agility!';
    } else {
      badgeEl.innerText = currentLang === 'ar' ? 'عبقري رياضيات (Math Wizard) 🏆' : 'Math Wizard 🏆';
      descEl.innerText = currentLang === 'ar' 
        ? 'مدهش! ذكاؤك الحسابي وسرعتك في التفكير تدل على عقلية عبقرية في حل المسائل الرياضية!' 
        : 'Astounding! Your rapid arithmetic agility and logical reasoning belong to a true mathematics wizard!';
    }
  } else if (currentTestType === 'arabic') {
    if (certTypeEl) certTypeEl.innerText = "شهادة جدارة في اللغة العربية الفصحى";
    if (quizScore <= 3) {
      badgeEl.innerText = currentLang === 'ar' ? 'براعم العربية (Arabic Beginner) 🧸' : 'Arabic Beginner 🧸';
      descEl.innerText = currentLang === 'ar' 
        ? 'بداية طيبة يا بطل! واصل الاستماع لقصص الحروف والكلمات العربية المصورة لتقوية مهاراتك الإملائية!' 
        : 'Splendid start! Keep listening to letter sounds and viewing cute illustrated vocabulary books to grow!';
    } else if (quizScore <= 6) {
      badgeEl.innerText = currentLang === 'ar' ? 'فصيح متميز (Arabic Explorer) 🌟' : 'Arabic Explorer 🌟';
      descEl.innerText = currentLang === 'ar' 
        ? 'أحسنت صنعاً! تفهم المفردات العربية الفصحى، أسماء الإشارة، وقواعد الكتابة البسيطة ببراعة!' 
        : 'Excellent effort! You understand formal vocabulary, demonstrative pronouns, and basic grammar very well!';
    } else {
      badgeEl.innerText = currentLang === 'ar' ? 'سيبويه الصغير (Arabic Master) 🏆' : 'Arabic Master 🏆';
      descEl.innerText = currentLang === 'ar' 
        ? 'رائع وعظيم! لغتك فصيحة، وإملائك دقيق، وقدرتك على استيعاب القواعد تليق بكاتب بليغ ومبدع!' 
        : 'Incredible mastery! Your spelling is precise and your linguistic foundations reflect an future eloquent author!';
    }
  }
};

window.resetBuiltInQuiz = function() {
  quizCurrentIndex = 0;
  quizScore = 0;
  
  document.getElementById('quizPlayState').classList.add('hidden');
  document.getElementById('quizEndState').classList.add('hidden');
  document.getElementById('quizStartState').classList.remove('hidden');
};

function playTone(isSuccess) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (isSuccess) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    console.log("Audio blocked:", e);
  }
}
