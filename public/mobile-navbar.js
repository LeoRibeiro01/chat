class MobileNavbar {
  constructor(mobileMenu, navList, navLinks) {
    this.mobileMenu = document.querySelector(mobileMenu);
    this.navList = document.querySelector(navList);
    this.navLinks = document.querySelectorAll(navLinks);
    this.activeClass = "active";

    this.handleClick = this.handleClick.bind(this);
  }

  animateLinks() {
    // Anima os links de navegação quando o menu é aberto
    this.navLinks.forEach((link, index) => {
      link.style.animation
        ? (link.style.animation = "")
        : (link.style.animation = `navLinkFade 0.5s ease forwards ${
            index / 7 + 0.3
          }s`);
    });
  }

  handleClick() {
    // Alterna a classe 'active' para mostrar/ocultar o menu
    this.navList.classList.toggle(this.activeClass);
    this.mobileMenu.classList.toggle(this.activeClass); // Anima o ícone de menu
    this.animateLinks(); // Aplica animação nos links de navegação
  }

  addClickEvent() {
    // Adiciona evento de clique para abrir/fechar o menu
    this.mobileMenu.addEventListener("click", this.handleClick);
  }

  init() {
    if (this.mobileMenu) {
      this.addClickEvent(); // Adiciona o evento de clique
    }
    return this;
  }
}

// Inicializa a classe MobileNavbar
const mobileNavbar = new MobileNavbar(
  ".mobile-menu",  // Seleciona o ícone do menu
  ".nav-list",     // Seleciona a lista de navegação
  ".nav-list li"   // Seleciona os links dentro da lista de navegação
);

// Inicia o comportamento do menu
mobileNavbar.init();
