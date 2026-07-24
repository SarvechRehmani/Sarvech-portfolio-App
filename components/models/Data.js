const personalData = {
  // ---- profile ----
  initial: "S",
  name: "Sarvech Rehmani",
  nameWithBreak: "Sarvech<br>Rehmani",
  email: "Sarwech99@Gmail.com",
  resumeLink: "/resume/Sarvech_Resume.pdf",
  phone: "+92 313-3599267",
  specialization: "Java Development",
  location: "Karachi, Pakistan",
  locationMap: "https://maps.app.goo.gl/h87CbmYEbLtpgpPK9",
  description: [
    "As a dedicated Computer Science graduate with a passion for Java and full-stack development, I specialize in creating innovative software solutions. My expertise spans a wide range of modern frameworks and tools, including Spring Boot, Angular, and Tailwind CSS, enabling me to deliver high-quality, scalable applications that meet diverse project needs.",
    "With hands-on experience in building dynamic applications like a live cricket scoring system and an email sender platform, I combine technical proficiency with creativity. My commitment to problem-solving and continuous learning drives me to craft solutions that enhance user experiences and streamline complex processes.",
  ],
  // ---- image ----
  imageSrc: "img/avatars/avatar.avif",
  imageAlt: "Sarvech Rehmani – Java Developer",

  // ---- social links ----
  socials: [
    {
      icon: "fa-brands fa-github",
      url: "https://github.com/SarvechRehmani",
      title: "Github",
    },
    {
      icon: "fa-brands fa-threads",
      url: "https://www.threads.com/@sarvech_rehmani",
      title: "Threads",
    },
    {
      icon: "fa-brands fa-instagram",
      url: "https://www.instagram.com/sarvech_rehmani",
      title: "Instagram",
    },
    {
      icon: "fa-brands fa-facebook",
      url: "https://www.facebook.com/SarvechRehmani",
      title: "Facebook",
    },
    {
      icon: "fa-brands fa-linkedin",
      url: "https://www.linkedin.com/in/sarvech-rehmani",
      title: "LinkedIn",
    },
  ],
  // ---- CTA ----
  cta: {
    text: "Let's Work Together!",
    href: "#contact",
    target: "_blank",
  },
  // ---- Teaser message ----
  teaser:
    "Want to know more about me, tell me about your project or just to say hello?",
};

const achievementsData = [
  { number: '10+', description: 'Happy clients' },
  { number: '2.5+', description: 'Years of experience' },
  { number: '30+', description: 'Projects done' },
  // Add more achievements if needed
];

// Menu items – define label, icon class, and anchor (fragment)
const menuItems = [
  { label: "Home", icon: "ph-house-simple", anchor: "#home" },
  { label: "About Me", icon: "ph-user", anchor: "#about" },
  { label: "Resume", icon: "ph-article", anchor: "#resume" },
  { label: "Portfolio", icon: "ph-squares-four", anchor: "#portfolio" },
  { label: "Contact", icon: "ph-envelope", anchor: "#contact" },
];

const servicesData = [
  {
    id: "backend",
    title: "Backend <br />Development",
    tags: ["Java", "Spring Boot"],
    description:
      "Building scalable APIs, database management, authentication, and server-side logic.",
    image: "img/services/1200x900_s03.webp",
    imageAlt: "Backend Development Service",
  },
  {
    id: "frontend",
    title: "Frontend <br />Development",
    tags: ["Angular", "TypeScript"],
    description:
      "Building dynamic and interactive web applications with Angular.",
    image: "img/services/1200x900_s02.webp",
    imageAlt: "Frontend Development Service",
  },
  // Add more services here if needed
  // {
  //   id: 'fullstack',
  //   title: 'Full Stack <br />Development',
  //   tags: ['Angular', 'Spring Boot'],
  //   description: 'End-to-end development with modern frameworks.',
  //   image: 'img/services/1200x900_s01.webp',
  //   imageAlt: 'Full Stack Development',
  // },
];

const educationData = [
  {
    id: "bs-cs",
    degree: "BS Computer Science",
    cgpa: "3.7 / 4.00",
    institution: "University of Sindh",
    institutionUrl: "https://www.usindh.edu.pk/",
    date: "January-2020 - December-2023",
    location: "Jamshoro, Sindh, Pakistan",
  },
  // Add more education entries here if needed
  // {
  //   id: 'ms-cs',
  //   degree: 'MS Computer Science',
  //   cgpa: '3.8 / 4.00',
  //   institution: 'Some University',
  //   institutionUrl: 'https://example.edu/',
  //   date: '2024 - 2026',
  //   location: 'City, Country',
  // },
];

const experienceData = [
  {
    id: "avrio-global",
    title: "Java Developer",
    company: "Avrio Global",
    companyUrl: "https://avrioglobal.io/",
    date: "June 2024 – Present",
    location: "Karachi, Pakistan",
    contributions: ["New Business Department", "Group Benefits Department"],
    responsibilities: [
      "Develop, test, and maintain high-quality Java applications",
      "Collaborate with team members to design and implement software solutions",
      "Troubleshoot and debug issues to improve software performance and reliability",
      "Work on webservices development using SOAP and RESTful APIs framework",
      "Utilize software development tools such as IDEs (Eclipse, IntelliJ IDEA) and version control systems (GitHub)",
    ],
    // Optional: vendor info (subtitle) – we'll render it as a heading
    vendor: "Vendor at EFU Life Assurance",
  },
  {
    id: "mt-pixels",
    title: "Full-stack Developer",
    company: "MT Pixels",
    companyUrl: "https://mtpixels.com/",
    date: "March 2024 – May 2024",
    location: "Karachi, Pakistan",
    contributions: ["admin panel for Engro Corp."],
    responsibilities: [
      "Developed full stack applications using Angular and Java Spring Boot for seamless integration.",
      "Created RESTful APIs with Java Spring Boot to add key features.",
      "Managed data with MySQL for reliable storage.",
      "Engaged in continuous learning and development.",
      "Utilize software development tools such as IDEs (Eclipse, IntelliJ IDEA) and version control systems (GitHub)",
    ],
    // No vendor for this one
  },
];

const projectsData = {
  desktop_crud_application: {
    id: "project1",
    title: "Desktop CRUD Application - Java Swing",
    date: "March 2022",
    client: "Self Learning",
    status: "Completed",
    comingSoon: false,
    overview:
      "Developed a desktop-based CRUD application using Java Swing, MySQL, and Eclipse IDE. The application features a user-friendly graphical interface that allows users to perform Create, Read, Update, and Delete operations efficiently, enabling easy interaction and effective data management.",
    summary:
      'Developed a comprehensive desktop <span class="highlight">CRUD application</span> using <span class="tech">Java Swing</span> for the frontend and <span class="tech">MySQL</span> for database management, built entirely within the <span class="tech">Eclipse IDE</span>. The application provides users with intuitive <span class="highlight">Create, Read, Update, and Delete</span> functionality through a clean graphical interface designed for <span class="highlight">efficient data management</span>. Features include form validation, search capabilities, and confirmation dialogs to ensure <span class="highlight">error-resistant operations</span>.',
    features: [
      'Developed a desktop-based CRUD application using <span class="tech">Java Swing</span> framework with <span class="tech">MySQL</span> database backend',
      'Built entirely within <span class="tech">Eclipse IDE</span>, implementing MVC architecture for clean separation of concerns',
      'Designed an intuitive graphical user interface with <span class="tech">Swing components</span> (JFrame, JTable, JButton) for seamless data interaction',
      "Implemented full CRUD functionality:",
      '<ul class="sub-features"><li>Create: Add new records through user-friendly forms</li><li>Read: Display data in organized tables with search/filter capabilities</li><li>Update: Modify existing records with validation checks</li><li>Delete: Remove records with confirmation dialogs</li></ul>',
      'Established efficient <span class="tech">JDBC connectivity</span> between Java frontend and MySQL database',
      'Optimized database operations with <span class="tech">prepared statements</span> to prevent SQL injection',
      'Designed for non-technical users with <span class="tech">error handling</span> and user feedback mechanisms',
      '<hr /><li><span class="highlight">Technologies used</span>: <span class="tech">Java Swing</span>, <span class="tech">MySQL</span>, <span class="tech">Eclipse IDE</span>, <span class="tech">JDBC</span></li>',
    ],
    extraFeatures: null,
    tags: ["Java Swing", "MySQL"],
    technologies: ["Java Swing", "MySQL", "Eclipse IDE", "JDBC"],
    images: ["/img/projects/project1/project100.avif"],
    links: {
      github:
        "https://github.com/SarvechRehmani/CRUD-Desktop-Application-Java-Swing",
      github2: null,
      live: null,
    },
  },
   // netflix_clone_angular: {
  //   id: "project2",
  //   title: "Netflix Clone using Angular",
  //   date: "December 2022",
  //   client: "Self Learning",
  //   status: "Completed",
  //   comingSoon: true,
  //   link: "",
  //   overview:
  //     "Developed a Netflix clone using Angular, TypeScript, HTML, CSS, and the TMDB API for learning purposes. The application features a dynamic and responsive user interface, allowing users to browse and search for movies while fetching real-time movie details from The Movie Database (TMDB).",
  //   summary:
  //     "Coming Soon – This project is currently being updated. Please check back later for the complete details.",
  //   features: [],
  //   extraFeatures: null,
  //   tags: ["Angular", "TMDB API"],
  //   technologies: [
  //     "Angular",
  //     "TMDB API",
  //     "HTML5",
  //     "CSS3",
  //     "TypeScript",
  //     "RxJS",
  //   ],
  //   images: ["/img/projects/project2/project200.avif"],
  //   links: {
  //     github:
  //       "https://github.com/SarvechRehmani/Netflix-Clone-using-Angular-TMDB",
  //     github2: null,
  //     live: null,
  //   },
  // },
  airline_reservation_system: {
    id: "project3",
    title: "ST Airline Reservation System",
    date: "August 2021",
    client: "Academic Project",
    status: "Completed",
    comingSoon: false,
    link: "",
    overview:
      "Developed the ST Airline Reservation System using PHP, MySQL, and XAMPP. The platform supports flight booking, secure login, ticket viewing, and includes an admin dashboard for managing flights, passengers, and revenue.",
    summary:
      'Developed a complete <span class="highlight">Airline Reservation System</span> using <span class="tech">PHP</span> and <span class="tech">MySQL</span>, deployed on <span class="tech">XAMPP Server</span>. This full-stack web application features a <span class="highlight">secure user authentication</span> system, <span class="highlight">flight search</span> and <span class="highlight">booking functionality</span>, and a comprehensive <span class="highlight">admin dashboard</span> for managing flights, passengers, and revenue. Built with <span class="tech">HTML5</span>, <span class="tech">CSS3</span>, and <span class="tech">JavaScript</span>, the system provides an intuitive interface for both customers and administrators.',
    features: [
      'Developed a full-featured airline reservation system using <span class="tech">PHP</span> with <span class="tech">MySQL</span> database backend',
      'Implemented secure user authentication with <span class="tech">session management</span> and role-based access control',
      'Designed responsive user interfaces with <span class="tech">HTML5</span>, <span class="tech">CSS3</span>, and <span class="tech">JavaScript</span>',
      "Built core system functionalities:",
      '<ul class="sub-features"><li>User registration and login with password protection</li><li>Flight search with filters (date, destination, price)</li><li>Booking system with seat selection and payment processing</li><li>Ticket management with booking history and PDF generation</li><li>Contact form for customer support inquiries</li></ul>',
      "Created comprehensive admin dashboard with:",
      '<ul class="sub-features"><li>Flight management (add/edit/remove flights)</li><li>Passenger management and booking oversight</li><li>Revenue tracking and reporting</li><li>System configuration and user management</li></ul>',
      'Utilized <span class="tech">XAMPP</span> stack for local development and testing',
      'Implemented database security measures including <span class="tech">prepared statements</span> to prevent SQL injection',
      '<hr /><li><span class="highlight">Technologies used</span>: <span class="tech">PHP</span>, <span class="tech">XAMPP Server</span>, <span class="tech">HTML5</span>, <span class="tech">CSS3</span>, <span class="tech">JavaScript</span>, <span class="tech">MySQL</span></li>',
    ],
    extraFeatures: null,
    tags: ["PHP", "Bootstrap"],
    technologies: [
      "PHP",
      "XAMPP Server",
      "HTML5",
      "CSS3",
      "JavaScript",
      "MySQL",
    ],
    images: [
      "/img/projects/project3/project300.avif",
      "/img/projects/project3/project301.avif",
      "/img/projects/project3/project302.avif",
      "/img/projects/project3/project303.avif",
    ],
    links: {
      github: "https://github.com/SarvechRehmani/ST-AirLine-Reservation-System",
      github2: null,
      live: null,
    },
  },
  todo_pro: {
    id: "project4",
    title: "ToDo Pro - Java Servlet & Hibernate",
    date: "November 2021",
    client: "Self Learning",
    status: "Completed",
    comingSoon: false,
    overview:
      "Developed a web-based todo list application using Java Servlets, Hibernate, and MySQL. The app allows users to create, edit, delete, and mark tasks as complete, with a responsive interface built using HTML, CSS, and JavaScript. Data is reliably stored and managed through a MySQL database.",
    summary:
      'Developed a robust <span class="highlight">web-based todo application</span> using <span class="tech">Java Servlets</span> and <span class="tech">Hibernate ORM</span>, with <span class="tech">MySQL</span> for persistent data storage. This full-stack application features <span class="highlight">CRUD operations</span> for task management, implemented with <span class="highlight">Hibernate\'s object-relational mapping</span> for efficient database interactions. The responsive frontend built with <span class="tech">HTML5</span>, <span class="tech">CSS3</span>, and <span class="tech">JavaScript</span> provides an intuitive interface for creating, editing, and organizing tasks with completion status tracking.',
    features: [
      'Developed a full-featured todo application using <span class="tech">Java Servlets</span> and <span class="tech">Hibernate ORM</span> framework',
      'Implemented persistent data storage with <span class="tech">MySQL</span> database using Hibernate\'s object-relational mapping',
      'Designed responsive user interfaces with <span class="tech">HTML5</span>, <span class="tech">CSS3</span>, and <span class="tech">JavaScript</span>',
      "Built core system functionalities:",
      '<ul class="sub-features"><li>Create, read, update, and delete (CRUD) operations for tasks</li><li>Task completion status tracking with visual indicators</li><li>Intuitive user interface for task management</li><li>Data persistence across sessions</li></ul>',
      'Utilized <span class="tech">Hibernate</span> for:',
      '<ul class="sub-features"><li>Object-relational mapping between Java objects and database tables</li><li>Efficient database operations with HQL (Hibernate Query Language)</li><li>Transaction management and connection pooling</li></ul>',
      'Implemented the <span class="tech">MVC architecture</span> with Servlets as controllers and JSP for views',
      'Ensured application security with proper <span class="tech">session management</span> and input validation',
      '<hr /><li><span class="highlight">Technologies used</span>: <span class="tech">Java Servlets</span>, <span class="tech">Hibernate</span>, <span class="tech">MySQL</span>, <span class="tech">HTML5</span>, <span class="tech">CSS3</span>, <span class="tech">JavaScript</span></li>',
    ],
    extraFeatures: null,
    tags: ["Java", "Servlet & JSP"],
    technologies: [
      "Java Servlets",
      "Hibernate",
      "MySQL",
      "HTML5",
      "CSS3",
      "JavaScript",
    ],
    images: ["/img/projects/project4/project400.avif", "/img/projects/project4/project401.avif", "/img/projects/project4/project402.avif"],
    links: {
      github:
        "https://github.com/SarvechRehmani/ToDoPro-using-Java-Servlet-and-Hibernate",
      github2: null,
      live: null,
    },
  },
  code_genius_blog: {
    id: "project5",
    title: "Code Genius Blog",
    date: "2023",
    client: "Personal Project",
    status: "Completed",
    comingSoon: false,
    overview:
      "Developed a Java-based web application using Spring Boot and Hibernate that allows users to create and share tech-related posts. Key features include user authentication, post categorization, image uploads, profile management, and a like system to boost user engagement, with a frontend built using HTML, CSS, and JavaScript.",
    summary:
      'Developed a comprehensive <span class="highlight">Java-based web application</span> for creating and sharing tech-related blog posts. This full-stack application features a <span class="highlight">secure user authentication</span> system, <span class="highlight">post categorization</span>, <span class="highlight">image uploading</span>, and a <span class="highlight">like system</span>. Built with <span class="tech">Java Servlets</span>, <span class="tech">JSP</span>, and <span class="tech">Hibernate</span>, the blog provides an intuitive interface for both readers and content creators with a responsive design using <span class="tech">Bootstrap</span>.',
    features: [
      'Developed a full-featured blog platform using <span class="tech">Java Servlets</span> and <span class="tech">JSP</span> with <span class="tech">Hibernate ORM</span> for database management',
      'Implemented secure user authentication with <span class="tech">session management</span> and role-based access control',
      'Designed responsive user interfaces with <span class="tech">Bootstrap</span>, <span class="tech">HTML5</span>, <span class="tech">CSS3</span>, and <span class="tech">JavaScript</span>',
      "Built core blog functionalities:",
      '<ul class="sub-features"><li>User registration and login system with secure password handling</li><li>Create, edit, and delete blog posts with rich text formatting</li><li>Categorization system for organizing tech-related content</li><li>Image upload and management for blog post visuals</li><li>Like system for user engagement and post appreciation</li><li>User profile editing and management</li></ul>',
      'Utilized <span class="tech">Hibernate</span> for efficient database operations and object-relational mapping',
      'Implemented <span class="tech">MySQL</span> database with proper normalization and relationships',
      "Designed RESTful architecture for efficient client-server communication",
      '<hr /><li><span class="highlight">Technologies used</span>: <span class="tech">Java Servlets & JSP</span>, <span class="tech">Hibernate</span>, <span class="tech">MySQL</span>, <span class="tech">HTML5</span>, <span class="tech">CSS3</span>, <span class="tech">JavaScript</span>, <span class="tech">Bootstrap</span></li>',
    ],
    extraFeatures: null,
    tags: ["Servlet & JSP", "Hibernate"],
    technologies: [
      "Java Servlets & JSP",
      "Hibernate",
      "MySQL",
      "HTML5",
      "CSS3",
      "JavaScript",
      "Bootstrap",
    ],
    images: [
      "/img/projects/project5/project500.avif",
      "/img/projects/project5/project501.avif",
      "/img/projects/project5/project502.avif",
      "/img/projects/project5/project503.avif",
      "/img/projects/project5/project504.avif",
      "/img/projects/project5/project505.avif",
      "/img/projects/project5/project506.avif",
    ],
    links: {
      github:
        "https://github.com/SarvechRehmani/CodeGeniusBlog-in-Java-Servlet-and-Hibernate",
      github2: null,
      live: null,
    },
  },
  codeventure: {
    id: "project6",
    title: "CodeVenture - Integrated Learning & Job Portal",
    date: "June 2023",
    client: "Academic Project",
    status: "Completed",
    comingSoon: false,
    overview:
      "Developed a full-stack E-learning and Job Portal application using Java, Spring Boot, Spring Security, Hibernate, Angular, HTML, CSS, and TypeScript. The platform offers educational course access, job matching, skill enhancement tools, job posting capabilities for employers, and candidate search features to streamline recruitment.",
    summary:
      'Developed a comprehensive <span class="highlight">Integrated Learning and Job Portal</span> using <span class="tech">Spring Boot</span> and <span class="tech">Angular</span>. This full-stack application combines <span class="highlight">e-learning capabilities</span> with <span class="highlight">job matching functionality</span>, creating a platform where users can enhance their skills and connect with relevant job opportunities. The system features <span class="tech">Spring Security</span> for authentication, <span class="tech">Hibernate</span> for data persistence, and a modern <span class="tech">Angular</span> frontend with <span class="tech">TypeScript</span>.',
    features: [
      'Developed a full-stack application with <span class="tech">Spring Boot</span> backend and <span class="tech">Angular</span> frontend',
      'Implemented secure authentication using <span class="tech">Spring Security</span> with JWT (JSON Web Tokens)',
      'Designed responsive user interfaces with <span class="tech">Angular</span>, <span class="tech">HTML5</span>, <span class="tech">CSS3</span>, and <span class="tech">TypeScript</span>',
      "Built core learning platform features:",
      '<ul class="sub-features"><li>Course catalog with filtering and search capabilities</li><li>Progress tracking and course completion certificates</li><li>Skill assessment and recommendation system</li></ul>',
      "Implemented job portal functionality:",
      '<ul class="sub-features"><li>Job posting and application system for employers</li><li>Candidate search with skill-based matching</li><li>Resume builder and profile management</li></ul>',
      'Utilized <span class="tech">Hibernate ORM</span> for efficient database operations:',
      '<ul class="sub-features"><li>Complex entity relationships between users, courses, and jobs</li><li>Optimized queries for performance</li><li>Transaction management for data integrity</li></ul>',
      "Implemented RESTful API architecture with proper documentation",
      '<hr /><li><span class="highlight">Technologies used</span>: <span class="tech">Java</span>, <span class="tech">Spring Boot</span>, <span class="tech">Spring Security</span>, <span class="tech">Hibernate</span>, <span class="tech">Angular</span>, <span class="tech">HTML</span>, <span class="tech">CSS</span>, <span class="tech">TypeScript</span></li>',
    ],
    extraFeatures: null,
    tags: ["Angular", "Spring Boot"],
    technologies: [
      "Java",
      "Spring Boot",
      "Spring Security",
      "Hibernate",
      "Angular",
      "HTML",
      "CSS",
      "TypeScript",
    ],
    images: [
      "/img/projects/project6/project600.avif",
      "/img/projects/project6/project601.avif",
      "/img/projects/project6/project602.avif",
      "/img/projects/project6/project603.avif",
      "/img/projects/project6/project604.avif",
      "/img/projects/project6/project605.avif",
      "/img/projects/project6/project606.avif",
      "/img/projects/project6/project607.avif",
      "/img/projects/project6/project608.avif",
    ],
    links: {
      github:
        "https://github.com/SarvechRehmani/The-Integrated-Learning-and-Job-Portal-CodeVenture-Backend",
      github2:
        "https://github.com/SarvechRehmani/The-Integrated-Learning-and-Job-Portal-CodeVenture-Frontend-Angular",
      live: null,
    },
  },
  cricket_pulse: {
    id: "project7",
    title: "Cricket Pulse - Live Cricket Scoring Application",
    date: "September 2023",
    client: "Self Learning",
    status: "Completed",
    comingSoon: false,
    overview:
      "Developed Cricket Pulse, a live cricket score app using Spring Boot, MySQL, Angular, and Tailwind CSS. It features real-time updates, player stats, and team data, with a responsive UI, ngx-toastr alerts, and optimized performance through SSR and prerendering.",
    summary:
      'Developed a comprehensive <span class="highlight">live cricket scoring application</span> using <span class="tech">Spring Boot</span> and <span class="tech">Angular</span>. Cricket Pulse delivers <span class="highlight">real-time match updates</span>, detailed player statistics, and team information through a responsive interface built with <span class="tech">Angular standalone components</span> and styled with <span class="tech">Tailwind CSS</span>. The application features <span class="highlight">server-side rendering</span> for optimal performance and integrates <span class="tech">ngx-toastr</span> for real-time notifications of key match events.',
    features: [
      'Developed a full-stack live cricket scoring application with <span class="tech">Spring Boot</span> backend and <span class="tech">Angular</span> frontend',
      "Implemented real-time score updates using WebSockets for live data streaming",
      'Designed responsive user interfaces with <span class="tech">Angular</span>, <span class="tech">Tailwind CSS</span>, <span class="tech">HTML5</span>, and <span class="tech">TypeScript</span>',
      "Built core cricket features:",
      '<ul class="sub-features"><li>Live ball-by-ball commentary and scorecards</li><li>Player statistics and career records</li><li>Team profiles and match history</li><li>Match scheduling and tournament brackets</li></ul>',
      'Utilized <span class="tech">MySQL</span> for data persistence:',
      '<ul class="sub-features"><li>Optimized database schema for cricket data relationships</li><li>Complex queries for player and match statistics</li><li>Efficient storage of historical match data</li></ul>',
      "Implemented performance optimizations:",
      '<ul class="sub-features"><li>Angular server-side rendering (SSR) and prerendering</li><li>Lazy loading of components</li><li>Caching strategies for frequently accessed data</li></ul>',
      'Integrated <span class="tech">ngx-toastr</span> for real-time notifications of wickets, milestones, and match events',
      '<hr /><li><span class="highlight">Technologies used</span>: <span class="tech">Java</span>, <span class="tech">Spring Boot</span>, <span class="tech">MySQL</span>, <span class="tech">Angular</span>, <span class="tech">HTML</span>, <span class="tech">CSS</span>, <span class="tech">TypeScript</span>, <span class="tech">Tailwind CSS</span></li>',
    ],
    extraFeatures: null,
    tags: ["Spring Boot", "Angular"],
    technologies: [
      "Java",
      "Spring Boot",
      "MySQL",
      "Angular",
      "HTML",
      "CSS",
      "TypeScript",
      "Tailwind CSS",
    ],
    images: [
      "/img/projects/project7/project700.avif",
      "/img/projects/project7/project701.avif",
      "/img/projects/project7/project702.avif",
      "/img/projects/project7/project703.avif",
      "/img/projects/project7/project704.avif",
    ],
    links: {
      github:
        "https://github.com/SarvechRehmani/Cricket-Pulse-Live-Score-Application-Backend",
      github2:
        "https://github.com/SarvechRehmani/Live-Cricket-Score-Web-Application-CricketPulse-Frontend",
      live: null,
    },
  },
  email_sender_application: {
    id: "project8",
    title: "SS Email Sender Application",
    date: "October 2023",
    client: "Self Learning",
    status: "Completed",
    comingSoon: false,
    overview:
      "Developed SsmailSender, an email management application using Angular, Tailwind CSS, and Java Spring Boot with SMTP integration. Features include file attachments, dynamic CC/TO fields, real-time notifications via ngx-toastr, and robust backend services for secure and efficient email handling.",
    summary:
      'Developed a comprehensive <span class="highlight">email management application</span> using <span class="tech">Spring Boot</span> and <span class="tech">Angular</span>. The SS Email Sender provides <span class="highlight">SMTP integration</span> for reliable email delivery with features for composing, sending, and managing emails. The application includes <span class="highlight">dynamic recipient fields</span>, <span class="highlight">file attachments</span>, and <span class="tech">ngx-toastr</span> notifications for real-time feedback. Built with <span class="tech">Tailwind CSS</span> for a modern, responsive interface and secured with proper validation and error handling.',
    features: [
      'Developed a full-stack email application with <span class="tech">Spring Boot</span> backend and <span class="tech">Angular</span> frontend',
      'Integrated with <span class="tech">SMTP</span> servers for reliable email delivery',
      'Designed responsive user interfaces with <span class="tech">Angular</span>, <span class="tech">Tailwind CSS</span>, <span class="tech">HTML5</span>, and <span class="tech">TypeScript</span>',
      "Implemented core email features:",
      '<ul class="sub-features"><li>Rich text email composition with formatting options</li><li>Dynamic recipient management (TO, CC, BCC) with addable fields</li><li>File attachment handling with size validation</li><li>Email history and sent items tracking</li></ul>',
      'Utilized <span class="tech">Spring Mail</span> for:',
      '<ul class="sub-features"><li>Secure email transmission with TLS support</li><li>Attachment processing and MIME message construction</li><li>Connection pooling for performance</li></ul>',
      'Integrated <span class="tech">ngx-toastr</span> for real-time notifications of email delivery status',
      "Implemented comprehensive validation:",
      '<ul class="sub-features"><li>Email address format verification</li><li>Attachment size and type restrictions</li><li>Input sanitization for security</li></ul>',
      "Designed a user-friendly interface with:",
      '<ul class="sub-features"><li>Clean, modern layout with Tailwind CSS</li><li>Responsive design for all device sizes</li><li>Intuitive workflow for composing and sending emails</li></ul>',
      '<hr /><li><span class="highlight">Technologies used</span>: <span class="tech">Java</span>, <span class="tech">Spring Boot</span>, <span class="tech">SMTP</span>, <span class="tech">Angular</span>, <span class="tech">HTML</span>, <span class="tech">CSS</span>, <span class="tech">TypeScript</span>, <span class="tech">Tailwind CSS</span></li>',
    ],
    extraFeatures: null,
    tags: ["SMTP", "Spring Boot"],
    technologies: [
      "Java",
      "Spring Boot",
      "SMTP",
      "Angular",
      "HTML",
      "CSS",
      "TypeScript",
      "Tailwind CSS",
    ],
    images: ["/img/projects/project8/project800.avif", "/img/projects/project8/project801.avif"],
    links: {
      github:
        "https://github.com/SarvechRehmani/SS-Mail-Sender-Applicationb-Backend",
      github2:
        "https://github.com/SarvechRehmani/Email-Sender-Application-Frontend",
      live: null,
    },
  },
  syncbox: {
    id: "project9",
    title: "SyncBox - Smart Contact Management System",
    date: "January-2025",
    client: "Personal Project",
    status: "Completed",
    comingSoon: false,
    overview:
      " SyncBox - Smart Contact Management System SyncBox is arobust and user-friendly contact management system built using Spring Boot and Java. It enables users to efficiently store, organize, and manage their contacts with advanced features like searching, filtering, and categorizing. The project also includes secure data handling, ensuring that user information is safely managed. Perfect for personal or business use.",
    summary:
      'Developed a comprehensive <span class="highlight">Smart Contact Management System</span> using <span class="tech">Spring Boot MVC</span> with a responsive frontend built with <span class="tech">Tailwind CSS</span> and <span class="tech">Flowbite</span>. This full-stack application features <span class="highlight">secure user authentication</span>, <span class="highlight">contact categorization</span>, and <span class="highlight">advanced search functionality</span>. Integrated <span class="tech">Cloudinary</span> for seamless contact image storage and implemented Excel export functionality for easy data backup and sharing.',
    features: [
      'Developed a full-featured contact management system using <span class="tech">Spring Boot MVC</span> with <span class="tech">MySQL</span> database backend',
      'Implemented secure user authentication with <span class="tech">role-based access control</span> and session management',
      'Designed responsive user interfaces with <span class="tech">Tailwind CSS</span> and <span class="tech">Flowbite</span> components',
      "Built core system functionalities:",
      '<ul class="sub-features"><li>Contact storage with advanced search and filtering capabilities</li><li>Contact categorization (family, work, friends, etc.)</li><li>Image upload and management using Cloudinary integration</li><li>Excel export functionality for data backup and sharing</li><li>User profile management with secure update functionality</li></ul>',
      'Integrated <span class="tech">Cloudinary</span> for efficient image storage and management',
      'Utilized <span class="tech">Hibernate ORM</span> for database operations and object-relational mapping',
      "Implemented RESTful architecture for efficient client-server communication",
      '<hr /><li><span class="highlight">Technologies used</span>: <span class="tech">Spring Boot</span>, <span class="tech">MVC</span>, <span class="tech">MySQL</span>, <span class="tech">Tailwind CSS</span>, <span class="tech">Flowbite</span>, <span class="tech">Cloudinary</span>, <span class="tech">Hibernate</span>, <span class="tech">Java 21</span></li>',
    ],
    extraFeatures: [
      '<span class="tech"><i class="ph-bold ph-address-book ms-2"></i> Contact Storage & Management :</span> Easily add, edit, delete, and manage contacts in an organized manner with intuitive interfaces.',
      '<span class="tech"><i class="ph-bold ph-magnifying-glass"></i> Advanced Search & Filtering :</span> Quickly search contacts by name, email, or phone number with advanced filtering options.',
      '<span class="tech"><i class="ph-bold ph-folders"></i> Contact Categorization :</span> Group contacts by categories (family, work, friends) for better organization and management.',
      '<span class="tech"><i class="ph-bold ph-user-circle"></i> User Authentication :</span> Secure login system with role-based access control ensuring data privacy and security.',
      '<span class="tech"><i class="ph-bold ph-image"></i> Cloudinary Integration :</span> Seamless contact image storage and management using Cloudinary API integration.',
      '<span class="tech"><i class="ph-bold ph-microsoft-excel-logo"></i> Excel Export :</span> Export contacts in Excel format for easy data backup, sharing, and offline access.',
    ],
    tags: ["Spring Boot", "TailwindCss"],
    technologies: [
      "Spring Boot",
      "MVC",
      "MySQL",
      "Tailwind CSS",
      "Flowbite",
      "Cloudinary",
      "Hibernate",
      "Java 21",
    ],
    images: [
      "/img/projects/project9/project900.avif",
      "/img/projects/project9/project901.avif",
      "/img/projects/project9/project902.avif",
      "/img/projects/project9/project903.avif",
      "/img/projects/project9/project904.avif",
      "/img/projects/project9/project905.avif",
      "/img/projects/project9/project906.avif",
      "/img/projects/project9/project907.avif",
      "/img/projects/project9/project908.avif",
      "/img/projects/project9/project909.avif",
      "/img/projects/project9/project910.avif",
    ],
    links: {
      github:
        "https://github.com/SarvechRehmani/SyncBox-Smart-Contact-Management-System-Spring-Boot",
      github2: null,
      live: null,
    },
  }
};

const certificatesData = [
  {
    id: "efu-bod-bpm",
    title: "Contribution in BOD BPM (EFU Life)",
    image: "certificates/BPMBODEFU.avif",
    alt: "Contribution in BOD BPM (EFU Life)",
    date: "Aug 2025",
    issuer: "EFU Life",
    description:
      "Received a certificate from EFU Life (Aug 2025) for my contribution to the BOD BPM project.",
    theme: "light", // light = no opposite class
  },
  {
    id: "efu-digital-policy",
    title: "Contribution in Digital Policy Document (EFU Life)",
    image: "certificates/DigitalPolicyDocumentEFU.avif",
    alt: "Contribution in Digital Policy Document (EFU Life)",
    date: "Aug 2025",
    issuer: "EFU Life",
    description:
      "Received a certificate from EFU Life (Aug 2025) for my contribution to the Digital Policy Document project.",
    theme: "light",
  },
  {
    id: "java-oop",
    title: "Object-Oriented Programming – Basics to Advanced (Java OOP)",
    image: "certificates/oops.avif",
    alt: "Object-Oriented Programming – Basics to Advanced (Java OOP)",
    date: "Nov 2024",
    issuer: "Udemy",
    description:
      "Completed Object-Oriented Programming – Basics to Advanced (Java OOP) on Nov 6, 2024, strengthening skills in object-oriented design and Java implementation.",
    theme: "dark", // dark = opposite class
  },
  {
    id: "java-masterclass",
    title: "Java Masterclass (Updated to Java 17)",
    image: "certificates/LearnJavaFromScratch.avif",
    alt: "Java Masterclass (Updated to Java 17)",
    date: "Nov 2023",
    issuer: "Udemy",
    description:
      "Completed Java Masterclass (Updated to Java 17) on Udemy (Nov 13, 2023), covering comprehensive Java concepts from fundamentals to advanced features.",
    theme: "dark",
  },
  {
    id: "java-from-scratch",
    title: "Learn Java Programming from Scratch",
    image: "certificates/LearnJavaFromScratch.avif",
    alt: "Learn Java Programming from Scratch",
    date: "Apr 2022",
    issuer: "Udemy",
    description:
      "Completed Learn Java Programming from Scratch on Udemy (Apr 13, 2022), developing hands-on skills in Java programming basics to advanced concepts.",
    theme: "light",
  },
  {
    id: "freelancing",
    title: "Freelancing Training",
    image: "certificates/freelancing.avif",
    alt: "Freelancing Training",
    date: "Sep 2021",
    issuer: "DigiSkills.pk",
    description:
      "Earned a Freelancing Training Certificate from DigiSkills.pk (Sep 2021), gaining practical knowledge of online freelancing platforms and work strategies.",
    theme: "light",
  },
  {
    id: "java-beginners",
    title: "Java Programming for Complete Beginners",
    image: "certificates/JavaBignners.avif",
    alt: "Java Programming for Complete Beginners",
    date: "July 2020",
    issuer: "Udemy",
    description:
      "Completed Java Programming for Complete Beginners on Udemy (Aug 23, 2021), strengthening my understanding of Java fundamentals and OOP concepts.",
    theme: "dark",
  },
  {
    id: "java-tutorials",
    title: "Java Tutorials for Complete Beginners",
    image: "certificates/JavaBasic.avif",
    alt: "Java Tutorials for Complete Beginners",
    date: "July 2020",
    issuer: "Udemy",
    description:
      "Completed Java Tutorials for Complete Beginners on Udemy (July 6, 2020), building a solid foundation in core Java programming.",
    theme: "dark",
  },
  {
    id: "html-css-easy",
    title: "HTML & CSS: Easy Steps to Create Web Templates from Scratch",
    image: "certificates/HtmlCssEasy.avif",
    alt: "HTML & CSS: Easy Steps to Create Web Templates from Scratch",
    date: "Mar 2019",
    issuer: "Udemy",
    description:
      "Completed HTML & CSS: Easy Steps to Create Web Templates from Scratch on Mar 17, 2019, learning practical skills to design and structure websites.",
    theme: "light",
  },
  {
    id: "html5-complete",
    title: "The Complete HTML5 Course",
    image: "certificates/Html5.avif",
    alt: "The Complete HTML5 Course",
    date: "Feb 2019",
    issuer: "Udemy",
    description:
      "Completed The Complete HTML5 Course on Udemy (Feb 7, 2019), gaining a strong foundation in modern web development.",
    theme: "light",
  },
];

const favSkillsData = [
  { id: "java", name: "Java", icon: "img/logos/java.webp", alt: "Java" },
  {
    id: "spring",
    name: "Spring",
    icon: "img/logos/spring.webp",
    alt: "Spring",
  },
  {
    id: "springboot",
    name: "Spring Boot",
    icon: "img/logos/springboot.webp",
    alt: "Spring Boot",
  },
  {
    id: "hibernate",
    name: "Hibernate",
    icon: "img/logos/hibernate.webp",
    alt: "Hibernate",
  },
  {
    id: "tailwind",
    name: "TailwindCss",
    icon: "img/logos/tailwind.webp",
    alt: "Tailwind CSS",
  },
  {
    id: "bootstrap",
    name: "Bootstrap",
    icon: "img/logos/bootstrap.webp",
    alt: "Bootstrap",
  },
  { id: "html", name: "HTML5", icon: "img/logos/html.webp", alt: "HTML5" },
  { id: "css", name: "CSS3", icon: "img/logos/css.webp", alt: "CSS3" },
  {
    id: "angular",
    name: "Angular",
    icon: "img/logos/angular.webp",
    alt: "Angular",
  },
  {
    id: "photoshop",
    name: "Photoshop",
    icon: "img/logos/photoshop.webp",
    alt: "Photoshop",
  },
];

export {
  personalData,
  achievementsData,
  menuItems,
  educationData,
  servicesData,
  projectsData,
  certificatesData,
  favSkillsData,
  experienceData,
};
