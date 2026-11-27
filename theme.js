/* CMA theme toggle: day (white+red) <-> night (dark blue) */
(function(){
  var KEY='cmaTheme', root=document.documentElement;
  function get(){try{return localStorage.getItem(KEY)||'light'}catch(e){return 'light'}}
  function apply(t){
    if(t==='dark') root.setAttribute('data-theme','dark'); else root.removeAttribute('data-theme');
    var m=document.querySelector('meta[name="theme-color"]');
    if(m) m.setAttribute('content', t==='dark' ? '#070D1F' : '#C4283F');
    var b=document.getElementById('themeBtn');
    if(b){
      b.setAttribute('aria-label', t==='dark' ? 'Day mode-e jao' : 'Night mode-e jao');
      b.setAttribute('aria-pressed', t==='dark' ? 'true' : 'false');
    }
  }
  function set(t){
    root.classList.add('theme-anim');
    try{localStorage.setItem(KEY,t)}catch(e){}
    apply(t);
    setTimeout(function(){root.classList.remove('theme-anim')},400);
    try{window.dispatchEvent(new CustomEvent('cma-theme-change',{detail:{theme:t}}))}catch(e){}
  }
  window.cmaTheme={get:get,set:set,toggle:function(){set(get()==='dark'?'light':'dark')}};
  apply(get());
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('#themeBtn');
    if(b){e.preventDefault();window.cmaTheme.toggle()}
  });
  document.addEventListener('DOMContentLoaded',function(){apply(get())});
})();
