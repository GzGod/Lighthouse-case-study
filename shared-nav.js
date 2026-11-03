(function () {
  const h = React.createElement;
  const languageKey = 'lighthouse-lang';
  const telegramUrl = 'https://t.me/xuegaozhanshen';

  function readLanguage() {
    try { return localStorage.getItem(languageKey) === 'en' ? 'en' : 'zh'; } catch { return 'zh'; }
  }

  window.useLighthouseLanguage = function useLighthouseLanguage() {
    const [lang, setLangState] = React.useState(readLanguage);
    const setLang = React.useCallback(value => {
      const next = value === 'en' ? 'en' : 'zh';
      setLangState(next);
      try { localStorage.setItem(languageKey, next); } catch {}
      document.documentElement.lang = next === 'en' ? 'en' : 'zh-CN';
    }, []);
    React.useEffect(() => { document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN'; }, [lang]);
    return [lang, setLang];
  };

  window.LighthouseNav = function LighthouseNav({ lang = 'zh', onLanguageChange, active = '', overlay = false }) {
    const english = lang === 'en';
    const labels = english
      ? { about: 'ATTENTION PLAYS', benchmarks: 'BENCHMARKS', playbooks: 'PLAYBOOKS', library: 'CASE LIBRARY', cases: 'CASES', matrix: 'TRAFFIC MATRIX', contact: 'CONTACT', app: 'OPEN APP', language: '中文' }
      : { about: '注意力方案', benchmarks: '价格基准', playbooks: '执行案例', library: '案例库', cases: '代表案例', matrix: '流量矩阵', contact: 'Telegram 联系', app: '打开应用', language: 'EN' };
    const items = [
      { key: 'about', href: '/#about', label: labels.about },
      { key: 'benchmarks', href: '/#kpi', label: labels.benchmarks },
      { key: 'library', href: '/cases', label: labels.library },
      { key: 'matrix', href: '/#matrix', label: labels.matrix },
    ];
    const headerClass = 'sticky top-0 z-50 border-b border-[#c7ddf8] bg-white/95 backdrop-blur-xl';

    return h('header', { className: headerClass, 'data-shared-nav': 'true' },
      h('div', { className: 'mx-auto flex h-14 max-w-[1360px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10' },
        h('a', { href: '/', className: 'flex min-w-0 shrink-0 items-center gap-2.5 text-[#0a0d14]', 'aria-label': 'Lighthouse home' },
          h('span', { className: 'font-display truncate text-[16px] font-semibold sm:text-[17px]' }, english ? 'Lighthouse' : '灯塔'),
          h('span', { className: 'h-4 w-px shrink-0 bg-[#c7ddf8]' }),
          h('img', { src: '/assets/lighthouse-logo.svg', alt: 'Lighthouse', className: 'h-[17px] w-auto shrink-0 opacity-95' })
        ),
        h('div', { className: 'flex shrink-0 items-center gap-2 sm:gap-3' },
          h('button', {
            type: 'button',
            onClick: () => onLanguageChange?.(english ? 'zh' : 'en'),
            className: 'inline-flex h-9 min-w-10 items-center justify-center border border-[#c7ddf8] px-2.5 font-mono text-[10px] uppercase text-[#4b6080] transition hover:border-[#1d6fda] hover:text-[#1d6fda] rounded-lg',
            'aria-label': english ? 'Switch to Chinese' : 'Switch to English',
            title: english ? 'Switch to Chinese' : 'Switch to English',
          }, labels.language),
          h('a', {
            href: telegramUrl,
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'inline-flex h-9 items-center justify-center whitespace-nowrap bg-[#1d6fda] border border-[#1d6fda] px-3 font-mono text-[10px] uppercase text-white transition hover:bg-[#1558b8] rounded-lg sm:px-4',
          }, labels.contact),
          h('a', {
            href: 'https://app.lhdao.top/',
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'hidden h-9 items-center justify-center whitespace-nowrap border border-[#c7ddf8] px-3 font-mono text-[10px] uppercase text-[#4b6080] transition hover:border-[#1d6fda] hover:text-[#1d6fda] rounded-lg sm:inline-flex sm:px-4',
          }, labels.app)
        )
      ),
      h('div', { className: 'border-t border-[#c7ddf8]' },
        h('nav', { className: 'lh-nav-scroll mx-auto max-w-[1360px] overflow-x-auto px-4 sm:px-6 lg:px-10', 'aria-label': english ? 'Main navigation' : '主导航' },
          h('div', { className: 'flex w-max min-w-full items-center justify-between gap-5 py-2.5 sm:gap-7' },
            items.map(item => h('a', {
              key: item.key,
              href: item.href,
              'aria-current': active === item.key ? 'page' : undefined,
              className: `shrink-0 whitespace-nowrap font-mono text-[9px] uppercase leading-4 transition sm:text-[10px] ${active === item.key ? 'text-[#1d6fda] font-semibold' : 'text-[#4b6080] hover:text-[#0a0d14]'}`,
            }, item.label))
          )
        )
      )
    );
  };

  const style = document.createElement('style');
  style.textContent = '.lh-nav-scroll{scrollbar-width:none}.lh-nav-scroll::-webkit-scrollbar{display:none}html{scroll-padding-top:100px}';
  document.head.appendChild(style);
})();
