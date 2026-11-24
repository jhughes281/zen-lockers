/* Zen Lockers exhibits: small dependency-free SVG charts.
   Each chart is drawn from a data object, gets a hover/focus tooltip,
   and ships with a plain data table so no figure is colour- or hover-only. */
(function(){
  var NS='http://www.w3.org/2000/svg';
  function el(name,attrs,text){
    var n=document.createElementNS(NS,name);
    for(var k in attrs){ n.setAttribute(k,attrs[k]); }
    if(text!=null) n.textContent=text;
    return n;
  }
  function niceMax(v){
    var p=Math.pow(10,Math.floor(Math.log10(v))), m=v/p;
    var step=m<=1?1:m<=2?2:m<=2.5?2.5:m<=5?5:10;
    return step*p;
  }
  function tooltip(host){
    var t=document.createElement('div');
    t.className='ex-tip'; t.setAttribute('role','status'); t.hidden=true;
    host.appendChild(t);
    return {
      show:function(html,x,y){
        t.innerHTML=html; t.hidden=false;
        var w=host.clientWidth, tw=t.offsetWidth;
        t.style.left=Math.max(0,Math.min(w-tw,x-tw/2))+'px';
        t.style.top=Math.max(0,y-t.offsetHeight-10)+'px';
      },
      hide:function(){ t.hidden=true; }
    };
  }
  function bindMark(mark,host,tip,html){
    function show(){
      var hb=host.getBoundingClientRect(), mb=mark.getBoundingClientRect();
      tip.show(html,mb.left-hb.left+mb.width/2,mb.top-hb.top);
      mark.classList.add('is-on');
    }
    function hide(){ tip.hide(); mark.classList.remove('is-on'); }
    mark.addEventListener('pointerenter',show);
    mark.addEventListener('pointerleave',hide);
    mark.addEventListener('focus',show);
    mark.addEventListener('blur',hide);
  }
  function dataTable(host,cfg){
    var d=document.createElement('details'); d.className='ex-data';
    var s=document.createElement('summary'); s.textContent='View the data'; d.appendChild(s);
    var t=document.createElement('table');
    var h='<thead><tr><th scope="col">'+cfg.labelHead+'</th><th scope="col">'+cfg.valueHead+'</th></tr></thead><tbody>';
    cfg.rows.forEach(function(r){ h+='<tr><th scope="row">'+r.label+'</th><td>'+cfg.fmt(r.value)+'</td></tr>'; });
    t.innerHTML=h+'</tbody>'; d.appendChild(t); host.appendChild(d);
  }

  /* Vertical columns: change over time, one series. */
  function columns(host,cfg){
    var W=640,H=cfg.height||300,L=44,R=12,T=26,B=34;
    var max=cfg.max||niceMax(Math.max.apply(null,cfg.rows.map(function(r){return r.value;})));
    var plotW=W-L-R, plotH=H-T-B, n=cfg.rows.length, band=plotW/n, bw=Math.min(46,band*0.62);
    var wrap=document.createElement('div'); wrap.className='ex-plot'; host.appendChild(wrap);
    var svg=el('svg',{viewBox:'0 0 '+W+' '+H,role:'img','aria-label':cfg.aria}); wrap.appendChild(svg);
    var ticks=cfg.ticks||4;
    for(var i=0;i<=ticks;i++){
      var v=max*i/ticks, y=T+plotH-(v/max)*plotH;
      svg.appendChild(el('line',{x1:L,x2:W-R,y1:y,y2:y,class:i===0?'ex-base':'ex-grid'}));
      svg.appendChild(el('text',{x:L-8,y:y+4,'text-anchor':'end',class:'ex-axis'},cfg.tickFmt?cfg.tickFmt(v):v));
    }
    var tip=tooltip(wrap);
    cfg.rows.forEach(function(r,idx){
      var h=(r.value/max)*plotH, x=L+band*idx+(band-bw)/2, y=T+plotH-h;
      var g=el('g',{class:'ex-mark'+(r.highlight?' ex-hi':''),tabindex:0,role:'img','aria-label':r.label+': '+cfg.fmt(r.value)});
      g.appendChild(el('rect',{x:L+band*idx,y:T,width:band,height:plotH,class:'ex-hit'}));
      g.appendChild(el('path',{class:'ex-bar',d:'M'+x+','+(y+3)+' q0,-3 3,-3 h'+(bw-6)+' q3,0 3,3 V'+(T+plotH)+' H'+x+' Z'}));
      svg.appendChild(g);
      if(r.direct){ svg.appendChild(el('text',{x:x+bw/2,y:y-7,'text-anchor':'middle',class:'ex-val'},cfg.fmt(r.value,true))); }
      if(!cfg.labelEvery || idx%cfg.labelEvery===0 || idx===n-1){
        svg.appendChild(el('text',{x:x+bw/2,y:H-12,'text-anchor':'middle',class:'ex-axis'},r.short||r.label));
      }
      bindMark(g,wrap,tip,'<b>'+cfg.fmt(r.value)+'</b><span>'+r.label+(r.note?' · '+r.note:'')+'</span>');
    });
    dataTable(host,cfg);
  }

  /* Horizontal bars: comparing named categories, one measure. */
  function bars(host,cfg){
    var wrap=document.createElement('div'); wrap.className='ex-plot ex-hbars'; host.appendChild(wrap);
    var max=cfg.max||Math.max.apply(null,cfg.rows.map(function(r){return r.value;}));
    var tip=tooltip(wrap);
    cfg.rows.forEach(function(r){
      var row=document.createElement('div'); row.className='ex-hrow'+(r.highlight?' ex-hi':''); row.tabIndex=0;
      row.setAttribute('aria-label',r.label+': '+cfg.fmt(r.value));
      row.innerHTML='<span class="ex-hlabel">'+r.label+'</span><span class="ex-htrack"><span class="ex-hfill" style="width:'+(r.value/max*100).toFixed(1)+'%"></span></span><span class="ex-hval">'+cfg.fmt(r.value,true)+'</span>';
      wrap.appendChild(row);
      if(r.note){ bindMark(row,wrap,tip,'<b>'+cfg.fmt(r.value)+'</b><span>'+r.note+'</span>'); }
    });
    dataTable(host,cfg);
  }

  window.ZenExhibits={columns:columns,bars:bars};
})();
