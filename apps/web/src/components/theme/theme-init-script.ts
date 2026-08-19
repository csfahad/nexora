import { THEME_STORAGE_KEY } from "@/components/theme/theme";

export const themeInitScript = `(function(){
try{
var c=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
if(c!=="dark"&&c!=="light")c="system";
var t=c==="system"?(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"):c;
var r=document.documentElement;
r.classList.remove("dark","light");
r.classList.add(t);
r.setAttribute("data-theme-choice",c);
}catch(e){document.documentElement.classList.add("dark");}
})();`;
