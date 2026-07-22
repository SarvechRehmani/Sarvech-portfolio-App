const TAGS = [
  "Java",
  "SQL",
  "Spring Boot",
  "Spring MVC",
  "Spring Security",
  "Spring Data JPA",
  "Hibernate",
  "TypeScript",
  "JavaScript",
  "HTML5",
  "CSS3",
  "Angular Material",
  "Bootstrap 5",
  "Tailwind CSS",
  "IntelliJ IDEA",
  "VS Code",
  "Postman",
  "Git/GitHub",
  "MySQL",
  "Eclipse",
  "NetBeans",
  "SOAP UI",
  "REST API",
  "SOAP Web Services",
  "SMTP",
  "OOP",
  "MVC Architecture",
  "JWT Authentication"
];

const ROWS = 4;
const TAGS_PER_ROW = 30;
const DURATION = 85000;
const shuffle = (array) => {
  return [...array].sort(() => Math.random() - 0.5);
};
const createTag = (text) => {
  const div = document.createElement("div");
  div.className = "tag";

  div.innerHTML = `
    <span>#</span> ${text}
  `;
  return div;
};
const createSlider = (tags, reverse = false) => {
  const slider = document.createElement("div");
  slider.className = "loop-slider";

  slider.style.setProperty(
    "--duration",
    `${DURATION}ms`
  );
  slider.style.setProperty(
    "--direction",
    reverse ? "reverse" : "normal"
  );
  
  const inner = document.createElement("div");
  inner.className = "inner-skill";
  const fragment = document.createDocumentFragment();
  [...tags, ...tags].forEach(tag => {
    fragment.appendChild(createTag(tag));
  });
  inner.appendChild(fragment);
  slider.appendChild(inner);
  return slider;
};

const renderSkills = () => {
  const container = document.getElementById("skill-slid");
  container.style.setProperty("overflow","hidden");
  container.style.setProperty("border-radius","24px");
  const fragment = document.createDocumentFragment();
  for(let i = 0; i < ROWS; i++){
    const rowTags = shuffle(TAGS)
      .slice(0,TAGS_PER_ROW);
    fragment.appendChild(
      createSlider(
        rowTags,
        i % 2 === 1
      )
    );
  }
  const fade = document.createElement("div");
  fade.className="fade";
  fragment.appendChild(fade);
  container.appendChild(fragment);
};
renderSkills();