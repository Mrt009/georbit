(() => {
  window.__georbitNavCleanup?.();

  let nav = document.querySelector(".header-main__nav");
  let toggle = document.querySelector(".mobile-toggle");

  if (!nav || !toggle) {
    const oldHeader = document.querySelector(".legacy-page .header, body > .header");
    if (!oldHeader) return;

    const template = document.createElement("template");
    template.innerHTML = `<header class="header-main" id="header-main">
      <div class="header-main__container">
        <div class="header-main__logo"><a href="/" class="header-main__logo-text" aria-label="Georbit home"><div class="header-main__logo-img"></div><span class="logo-wordmark">Georbit</span></a></div>
        <nav class="header-main__nav" aria-label="Main navigation">
          <ul class="nav__menu">
            <li><a class="menu-item-parent-link" href="research.html"><span>Research &amp; Labs</span><span class="menu-item-chevron" aria-hidden="true">⌄</span></a><div class="mega-menu"><div class="mega-menu__inner"><div class="mega-menu__intro"><div class="mega-menu__accent"></div><h3>Research &amp; Labs</h3><p>Advancing open research and developing talent. Explore our publications, fellowships, and faculty laboratories.</p></div><div class="mega-menu__links"><div class="mega-menu__col"><a href="research.html">Core Research Areas</a><a href="about.html#faculty">Research Team</a><a href="publications.html">Publications &amp; Papers</a><a href="research.html">Faculty Laboratories</a></div><div class="mega-menu__col"><a href="fellowship.html">Fellowships &amp; Research Internships</a><span class="mega-menu__coming-soon" aria-disabled="true">Research Opportunities <small>Coming Soon</small></span></div></div></div></div></li>
            <li><a class="menu-item-parent-link" href="publications.html"><span>Publications</span><span class="menu-item-chevron" aria-hidden="true">⌄</span></a><div class="mega-menu"><div class="mega-menu__inner"><div class="mega-menu__intro"><div class="mega-menu__accent"></div><h3>Publications</h3><p>Technical papers, preprints, and verifiable research implementations from Georbit’s laboratories.</p></div><div class="mega-menu__links"><div class="mega-menu__col"><a href="publications.html">Research Papers</a><a href="publications.html">Technical Systems</a><a href="publications.html">Preprints</a></div><div class="mega-menu__col"><a href="publications.html">Open-Source Code</a><a href="publications.html#patents">USPTO Patents</a></div></div></div></div></li>
            <li><a class="menu-item-parent-link" href="about.html"><span>Impact</span><span class="menu-item-chevron" aria-hidden="true">⌄</span></a><div class="mega-menu"><div class="mega-menu__inner"><div class="mega-menu__intro"><div class="mega-menu__accent"></div><h3>Impact</h3><p>See how Georbit’s open research is driving measurable results across industry and academia.</p></div><div class="mega-menu__links"><div class="mega-menu__col"><a href="about.html">Key Statistics</a><a href="publications.html">Case Studies</a><a href="research.html">Industry Partners</a></div></div></div></div></li>
            <li><a class="menu-item-parent-link" href="about.html"><span>About</span><span class="menu-item-chevron" aria-hidden="true">⌄</span></a><div class="mega-menu"><div class="mega-menu__inner"><div class="mega-menu__intro"><div class="mega-menu__accent"></div><h3>About</h3><p>Learn about Georbit, our mission, research association, and how to get involved.</p></div><div class="mega-menu__links"><div class="mega-menu__col"><a href="about.html">Our Mission</a><a href="about.html#team">Team &amp; Leadership</a></div><div class="mega-menu__col"><a href="contact.html">Contact</a><a href="blog.html">Media</a><a href="blog.html">News</a></div></div></div></div></li>
          </ul>
        </nav>
        <button class="mobile-toggle" type="button" aria-label="Toggle menu" aria-expanded="false"><span></span><span></span><span></span></button>
      </div>
    </header>`;
    oldHeader.replaceWith(template.content.firstElementChild);
    nav = document.querySelector(".header-main__nav");
    toggle = document.querySelector(".mobile-toggle");
  }

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

  const controller = new AbortController();
  const options = { signal: controller.signal };
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
  }, options);
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
  }, options);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); }, options);
  document.addEventListener("click", (event) => {
    if (nav.classList.contains("is-open") && !event.target.closest(".header-main")) close();
  }, options);
  window.addEventListener("resize", () => { if (window.innerWidth > 960) close(); }, options);
  window.__georbitNavCleanup = () => controller.abort();
})();
