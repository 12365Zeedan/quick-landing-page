const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/jspdf.es.min-xPuFTu_6.js","assets/index-B2BbflKq.js"])))=>i.map(i=>d[i]);
import{_ as w}from"./index-B2BbflKq.js";function r(s){return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}async function P({html:s,filename:p,orientation:x="landscape",margin:e=24}){if(typeof window>"u")return;const{default:g}=await w(async()=>{const{default:n}=await import("./jspdf.es.min-xPuFTu_6.js").then(t=>t.j);return{default:n}},__vite__mapDeps([0,1])),h=(await w(async()=>{const{default:n}=await import("./html2canvas-pro.esm-9xys3ejh.js");return{default:n}},[])).default,i=document.createElement("div");i.style.position="fixed",i.style.left="-10000px",i.style.top="0",i.innerHTML=s,document.body.appendChild(i);try{const n=i.firstElementChild,t=await h(n,{scale:2,backgroundColor:"#ffffff",useCORS:!0}),a=new g({orientation:x,unit:"pt",format:"a4"}),f=a.internal.pageSize.getWidth(),o=a.internal.pageSize.getHeight(),d=f-e*2,u=t.height*d/t.width;if(u<=o-e*2)a.addImage(t.toDataURL("image/png"),"PNG",e,e,d,u);else{const v=t.width/d,_=(o-e*2)*v;let m=0,b=!0;for(;m<t.height;){const c=Math.min(_,t.height-m),l=document.createElement("canvas");l.width=t.width,l.height=c;const y=l.getContext("2d");y.fillStyle="#ffffff",y.fillRect(0,0,l.width,l.height),y.drawImage(t,0,m,t.width,c,0,0,t.width,c),b||a.addPage(),b=!1,a.addImage(l.toDataURL("image/png"),"PNG",e,e,d,c/v),m+=c}}a.save(p)}finally{document.body.removeChild(i)}}function H({title:s,subtitle:p,date:x,headers:e,rows:g,lang:h,footerText:i}){const t=h==="ar"?"rtl":"ltr",a=g.length>0?g.map((f,o)=>`<tr style="background:${o%2?"#f8fafc":"#ffffff"}">`+f.map((d,u)=>`<td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;${u===0?"":"text-align:end;font-variant-numeric:tabular-nums;"}">${r(d)}</td>`).join("")+"</tr>").join(""):`<tr><td colspan="${e.length}" style="padding:18px;text-align:center;color:#94a3b8;">—</td></tr>`;return`
    <div dir="${t}" lang="${h}" style="font-family:'Cairo','Tahoma','Segoe UI',sans-serif;width:1100px;padding:28px;background:#ffffff;color:#0f172a;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:14px;">
        <div>
          <div style="font-size:20px;font-weight:700;">${r(s)}</div>
          ${p?`<div style="font-size:13px;color:#334155;margin-top:4px;">${r(p)}</div>`:""}
        </div>
        <div style="text-align:end;font-size:11px;color:#64748b;line-height:1.6;">
          <div>${r(x)}</div>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;direction:${t};">
        <thead>
          <tr style="background:#0f172a;color:#ffffff;">
            ${e.map((f,o)=>`<th style="padding:8px;text-align:${o===0?"start":"end"};">${r(f)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>${a}</tbody>
      </table>
      ${i?`<div style="margin-top:18px;font-size:10px;color:#94a3b8;text-align:center;">${r(i)}</div>`:""}
    </div>`}export{H as buildReportTableHtml,r as escapeHtml,P as exportHtmlAsPdf};
