(() => {
  const nav = document.querySelector(".header-main__nav");
  const toggle = document.querySelector(".mobile-toggle");
  if (!nav || !toggle) return;
  nav.id = nav.id || "primary-navigation";
  toggle.setAttribute("aria-controls", nav.id);
  toggle.setAttribute("aria-expanded", "false");
  nav.querySelectorAll(".nav__menu > li").forEach((item, index) => {
    const link = item.querySelector(":scope > .menu-item-parent-link");
    const submenu = item.querySelector(":scope > .mega-menu");
    if (!link || !submenu) return;
    submenu.id = submenu.id || `primary-submenu-${index + 1}`;
    link.setAttribute("aria-controls", submenu.id);
    link.setAttribute("aria-expanded", "false");
  });
  const close = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    nav.querySelectorAll("li.is-open").forEach((item) => item.classList.remove("is-open"));
    nav.querySelectorAll(".menu-item-parent-link").forEach((link) => link.setAttribute("aria-expanded", "false"));
  };
  toggle.addEventListener("click", () => {
    const open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", (event) => {
    if (!window.matchMedia("(max-width: 960px)").matches) return;
    const parent = event.target.closest(".menu-item-parent-link");
    if (parent) {
      const item = parent.closest("li");
      if (!item.classList.contains("is-open")) {
        event.preventDefault();
        nav.querySelectorAll("li.is-open").forEach((openItem) => openItem !== item && openItem.classList.remove("is-open"));
        nav.querySelectorAll(".menu-item-parent-link").forEach((link) => link.setAttribute("aria-expanded", String(link === parent)));
        item.classList.add("is-open");
        return;
      }
    }
    if (event.target.closest(".mega-menu a")) close();
  });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
  document.addEventListener("click", (event) => {
    if (nav.classList.contains("is-open") && !event.target.closest(".header-main")) close();
  });
  window.addEventListener("resize", () => { if (window.innerWidth > 960) close(); });
})();
