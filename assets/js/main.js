/* ----- NAVIGATION BAR FUNCTION ----- */


/* ----- ADD SHADOW ON NAVIGATION BAR WHILE SCROLLING ----- */
    


/* ----- TYPING EFFECT ----- */
   

/* ----- ## -- SCROLL REVEAL ANIMATION -- ## ----- */
   

  /* -- HOME -- */
  

  /* -- PROJECT BOX -- */
  

  /* -- HEADINGS -- */
  

/* ----- ## -- SCROLL REVEAL LEFT_RIGHT ANIMATION -- ## ----- */

  /* -- ABOUT INFO & CONTACT INFO -- */
  

  /* -- ABOUT SKILLS & FORM BOX -- */
  


/* ----- CHANGE ACTIVE LINK ----- */
  /* ----- NAVIGATION BAR FUNCTION ----- */
  function myMenuFunction(){
    var menuBtn = document.getElementById("myNavMenu");

    if(menuBtn.className === "nav-menu"){
      menuBtn.className += " responsive";
    } else {
      menuBtn.className = "nav-menu";
    }
  }

/* ----- ADD SHADOW ON NAVIGATION BAR WHILE SCROLLING ----- */
  window.onscroll = function() {headerShadow()};

  function headerShadow() {
    const navHeader =document.getElementById("header");

    if (document.body.scrollTop > 50 || document.documentElement.scrollTop >  50) {

      navHeader.style.boxShadow = "0 1px 6px rgba(0, 0, 0, 0.1)";
      navHeader.style.height = "70px";
      navHeader.style.lineHeight = "70px";

    } else {

      navHeader.style.boxShadow = "none";
      navHeader.style.height = "90px";
      navHeader.style.lineHeight = "90px";

    }
  }


/* ----- TYPING EFFECT ----- */
 var typingEffect = new Typed(".typedText",{
    strings : ["Java Developer","Spring Boot Dev","Java J2EE Dev"],
    loop : true,
    typeSpeed : 100, 
    backSpeed : 80,
    backDelay : 2000
 })


/* ----- ## -- SCROLL REVEAL ANIMATION -- ## ----- */
 const sr = ScrollReveal({
        origin: 'top',
        distance: '80px',
        duration: 2000,
        reset: true     
 })

/* -- HOME -- */
sr.reveal('.featured-text-card',{})
sr.reveal('.featured-name',{delay: 100})
sr.reveal('.featured-text-info',{delay: 200})
sr.reveal('.featured-text-btn',{delay: 200})
sr.reveal('.social_icons',{delay: 200})
sr.reveal('.featured-image',{delay: 300})


/* -- PROJECT BOX -- */
sr.reveal('.project-box',{interval: 200})

/* -- HEADINGS -- */
sr.reveal('.top-header',{})

/* ----- ## -- SCROLL REVEAL LEFT_RIGHT ANIMATION -- ## ----- */

/* -- ABOUT INFO & CONTACT INFO -- */
const srLeft = ScrollReveal({
  origin: 'left',
  distance: '80px',
  duration: 2000,
  reset: true
})

srLeft.reveal('.about-info',{delay: 100})
srLeft.reveal('.contact-info',{delay: 100})

/* -- ABOUT SKILLS & FORM BOX -- */
const srRight = ScrollReveal({
  origin: 'right',
  distance: '80px',
  duration: 2000,
  reset: true
})

srRight.reveal('.skills-box',{delay: 100})
srRight.reveal('.form-control',{delay: 100})



/* ----- CHANGE ACTIVE LINK ----- */

const sections = document.querySelectorAll('section[id]')

function scrollActive() {
  const scrollY = window.scrollY;

  sections.forEach(current =>{
    const sectionHeight = current.offsetHeight,
        sectionTop = current.offsetTop - 50,
      sectionId = current.getAttribute('id')

    if(scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) { 

        document.querySelector('.nav-menu a[href*=' + sectionId + ']').classList.add('active-link')

    }  else {

      document.querySelector('.nav-menu a[href*=' + sectionId + ']').classList.remove('active-link')

    }
  })
}

window.addEventListener('scroll', scrollActive)
  
   

function project1(){
  Swal.fire({
    title: "Project 1 Name",
    text: "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quis, at. Obcaecati, molestias minima repudiandae saepe ratione nesciunt? Possimumaiores dolor, aperiam, mollitia ad perferendis eligendi ducimus volupta sequi corrupti alias! Quas, qui sunt molestias ab eius, fugit quae dolore nisi cum, debitis harum id iusto nulla. Nihil repellendus a at cum similique",
    width: "60%",
    height: "60%",
    background: "#fff",
    confirmButtonColor: "#3085d6",
    confirmButtonText: "Close",
    html: "<div class='container2'><div class='left'><img src='assets/images/avatar.png' class='img' alt='Custom image'/> </div> <div class='right'>loremalskdklajskdj;asd;as;d asdkmaskldmklasd askldmasklndas dkaslmdkasd asdlasmdkas daslndmsad asdlnaskdnas daskldkaskdnsads adaspdasmdmasdas;ldmasnd</div></div>",
    // showCloseButton: true,
    // cancelButtonColor: "#d33",
    // imageUrl: "assets/images/avatar.png",
    // imageWidth: 500,
    // imageHeight: 450,
    // imageAlt: "Custom image",
  });
}



function project2(){
  Swal.fire({
    title: "Project 1 Name",
    text: "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quis, at. Obcaecati, molestias minima repudiandae saepe ratione nesciunt? Possimumaiores dolor, aperiam, mollitia ad perferendis eligendi ducimus volupta sequi corrupti alias! Quas, qui sunt molestias ab eius, fugit quae dolore nisi cum, debitis harum id iusto nulla. Nihil repellendus a at cum similique",
    width: "60%",
    height: "60%",
    background: "#fff",
    confirmButtonColor: "#3085d6",
    confirmButtonText: "Close",
    html: "<head><link rel='stylesheet' href='//cdn.jsdelivr.net/gh/dmhendricks/bootstrap-grid-css@4.1.3/dist/css/bootstrap-grid.min.css'/></head><div class='container'><div class='col-md-6'><img src='assets/images/avatar.png' class='img' alt='Custom image'/> </div> <div class='col-md-6'>loremalskdklajskdj;asd;as;d asdkmaskldmklasd askldmasklndas dkaslmdkasd asdlasmdkas daslndmsad asdlnaskdnas daskldkaskdnsads adaspdasmdmasdas;ldmasnd</div></div>",
    // showCloseButton: true,
    // cancelButtonColor: "#d33",
    // imageUrl: "assets/images/avatar.png",
    // imageWidth: 500,
    // imageHeight: 450,
    // imageAlt: "Custom image",
  });
}