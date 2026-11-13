import { useEffect, useState } from "react";

const validPages = new Set(["index", "about", "blog", "contact", "fellowship", "publications", "research"]);

function currentPage() {
  const name = location.pathname.split("/").pop()?.replace(/\.html$/i, "") || "index";
  return validPages.has(name) ? name : "index";
}

function pathFor(page) {
  return page === "index" ? "/" : `/${page}.html`;
}

export default function App() {
  const [page, setPage] = useState(currentPage);
  const [documentData, setDocumentData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const onPopState = () => setPage(currentPage());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setDocumentData(null);
    setError("");
    fetch(`/legacy/${page}.html`)
      .then((response) => {
        if (!response.ok) throw new Error("This page could not be loaded.");
        return response.text();
      })
      .then((source) => {
        if (cancelled) return;
        const parsed = new DOMParser().parseFromString(source, "text/html");
        const scripts = [...parsed.body.querySelectorAll("script")].map((script) => ({
          src: script.getAttribute("src"),
          type: script.getAttribute("type"),
          text: script.textContent || ""
        }));
        parsed.body.querySelectorAll("script").forEach((script) => script.remove());
        setDocumentData({
          page,
          title: parsed.title,
          html: parsed.body.innerHTML,
          styles: [...parsed.head.querySelectorAll("style")].map((style) => style.textContent || ""),
          links: [...parsed.head.querySelectorAll('link[rel="stylesheet"]')].map((link) => link.href),
          scripts
        });
      })
      .catch((loadError) => { if (!cancelled) setError(loadError.message); });
    return () => { cancelled = true; };
  }, [page]);

  useEffect(() => {
    if (!documentData || documentData.page !== page) return undefined;
    document.title = documentData.title || "Georbit";
    const styleNodes = documentData.styles.map((css) => {
      const node = document.createElement("style");
      node.dataset.georbitPageStyle = page;
      node.textContent = css;
      document.head.append(node);
      return node;
    });
    const linkNodes = documentData.links.map((href) => {
      const node = document.createElement("link");
      node.rel = "stylesheet";
      node.href = href;
      node.dataset.georbitPageStyle = page;
      document.head.append(node);
      return node;
    });

    let stopped = false;
    const runScripts = async () => {
      const host = document.querySelector(".legacy-page");
      for (const source of documentData.scripts) {
        if (stopped || !host) return;
        const script = document.createElement("script");
        if (source.type) script.type = source.type;
        if (source.src) {
          script.src = source.src;
          await new Promise((resolve) => {
            script.onload = resolve;
            script.onerror = resolve;
            host.append(script);
          });
        } else {
          script.textContent = source.text;
          host.append(script);
        }
      }
      if (location.hash) requestAnimationFrame(() => document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView());
    };
    runScripts();
    return () => {
      stopped = true;
      styleNodes.forEach((node) => node.remove());
      linkNodes.forEach((node) => node.remove());
    };
  }, [documentData, page]);

  function navigate(event) {
    const anchor = event.target.closest("a[href]");
    if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const destination = new URL(anchor.href, location.href);
    if (destination.origin !== location.origin || !/\.html$/i.test(destination.pathname)) return;
    const next = destination.pathname.split("/").pop().replace(/\.html$/i, "") || "index";
    if (!validPages.has(next)) return;
    event.preventDefault();
    history.pushState({}, "", `${pathFor(next)}${destination.hash}`);
    setPage(next);
    if (!destination.hash) window.scrollTo(0, 0);
  }

  if (error) return <main className="app-message" role="alert">{error}</main>;
  return <div className="react-site" onClick={navigate}>
    {!documentData || documentData.page !== page
      ? <main className="app-message" aria-live="polite">Loading Georbit…</main>
      : <div className="legacy-page" dangerouslySetInnerHTML={{ __html: documentData.html }} />}
  </div>;
}
