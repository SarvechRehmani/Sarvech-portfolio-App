export let projectNames = {
  desktop_crud_application: [
    "Desktop CRUD",
    "Desktop data management",
    "desktop",
  ],
  airline_reservation_system: [
    "ST Airline",
    "Airline reservation system",
    "web",
  ],
  todo_pro: ["ToDo Pro", "A simpler way to manage tasks", "web"],
  code_genius_blog: [
    "Code Genius Blog",
    "A space for ideas & developers",
    "web",
  ],
  codeventure: ["CodeVenture", "Learning meets opportunity", "fullstack"],
  cricket_pulse: [
    "Cricket Pulse",
    "Every ball. Every moment. Live.",
    "fullstack",
  ],
  email_sender_application: [
    "SS Email Sender",
    "Thoughtfully connected communication",
    "fullstack",
  ],
  syncbox: ["SyncBox", "Smart contact management", "fullstack"],
};
export let projectOrder = [
  "syncbox",
  "codeventure",
  "cricket_pulse",
  "email_sender_application",
  "code_genius_blog",
  "todo_pro",
  "airline_reservation_system",
  "desktop_crud_application",
];

export let skillGroups = [
  [
    "fa-code",
    "Programming languages",
    "The essentials",
    ["Java", "TypeScript", "JavaScript", "SQL", "HTML5", "CSS3"],
  ],
  [
    "fa-server",
    "Backend technologies",
    "Application engineering",
    [
      "Spring Boot",
      "Spring MVC",
      "Spring Security",
      "Spring Data JPA",
      "Spring ORM",
      "Hibernate",
      "JSP",
      "Servlets",
    ],
  ],
  [
    "fa-window-maximize",
    "Frontend technologies",
    "Interface development",
    ["Angular", "Angular Material", "Bootstrap 5", "Tailwind CSS"],
  ],
  [
    "fa-database",
    "Databases & integration",
    "Storage and connectivity",
    [
      "MySQL",
      "PostgreSQL",
      "Oracle",
      "RESTful APIs",
      "SOAP Web Services",
      "SMTP",
      "JWT Authentication",
    ],
  ],
  [
    "fa-diagram-project",
    "Architecture & DevOps",
    "Distributed systems",
    [
      "Microservice Architecture",
      "Spring Cloud Eureka",
      "API Gateway",
      "Config Server",
      "MVC Architecture",
      "Object-Oriented Programming",
      "Docker",
      "Apache Kafka",
      "Jenkins",
    ],
  ],
  [
    "fa-terminal",
    "Tools & platforms",
    "Development workflow",
    [
      "IntelliJ IDEA",
      "VS Code",
      "Postman",
      "Git",
      "GitHub",
      "MySQL Workbench",
      "Eclipse",
      "NetBeans",
      "XAMPP",
      "Swagger/OpenAPI",
      "SOAP UI",
    ],
  ],
];

export let workflows = [
  [
    "Java",
    "Spring Boot",
    "Spring MVC",
    "Spring Security",
    "Spring Data JPA",
    "Spring ORM",
    "Hibernate",
    "JSP",
    "Servlets",
    "Object-Oriented Programming",
    "MVC Architecture",
  ],
  [
    "Angular",
    "TypeScript",
    "JavaScript",
    "HTML5",
    "CSS3",
    "Angular Material",
    "Bootstrap 5",
    "Tailwind CSS",
    "VS Code",
  ],
  [
    "SQL",
    "MySQL",
    "PostgreSQL",
    "Oracle",
    "Spring Data JPA",
    "Hibernate",
    "MySQL Workbench",
  ],
  [
    "RESTful APIs",
    "SOAP Web Services",
    "SMTP",
    "JWT Authentication",
    "Spring Security",
    "Spring Boot",
    "Postman",
    "Swagger/OpenAPI",
    "SOAP UI",
  ],
  [
    "Microservice Architecture",
    "Spring Cloud Eureka",
    "API Gateway",
    "Config Server",
    "Docker",
    "Apache Kafka",
    "Jenkins",
    "Spring Boot",
  ],
  [
    "Git",
    "GitHub",
    "Jenkins",
    "Docker",
    "IntelliJ IDEA",
    "Eclipse",
    "NetBeans",
    "VS Code",
    "XAMPP",
  ],
];

export let skillConnections=Object.fromEntries(skillGroups.flatMap(group=>group[3]).map(name=>[name,[...new Set(workflows.filter(flow=>flow.includes(name)).flat())].filter(target=>target!==name).slice(0,6)]));
export function hydrateCatalog(snapshot){
 projectOrder=[...(snapshot.projects||[])].sort((a,b)=>Number(!!b.featured)-Number(!!a.featured)).map(p=>p.legacy_id||p.slug||p.id);projectNames=Object.fromEntries((snapshot.projects||[]).map(p=>[p.legacy_id||p.slug||p.id,[p.name||p.title,p.overview||'',p.category||'web']]));
 skillGroups=(snapshot.skill_groups||[]).map(g=>[g.icon||'fa-code',g.title,g.description||'',g.names||[]]);
 skillConnections={};
 for(const group of snapshot.skill_groups||[]){for(const name of group.names||[]){const targets=Object.prototype.hasOwnProperty.call(group,'connections_by_skill')?(group.connections_by_skill?.[name]||[]):[...new Set(workflows.filter(w=>w.includes(name)).flat())].filter(target=>target!==name).slice(0,6);skillConnections[name]=[...new Set(targets)].filter(target=>target!==name);}}

}

