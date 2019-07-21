/* Detect flexbox support. Add no-flex class to html if flexbox not supported */
(function(d){
    var c = "", cl = d.documentElement.className, f = "flex", fw = "-webkit-"+f, e = d.createElement('p');
    try { 
        e.style.display = fw; 
        e.style.display = f; 
        c = (e.style.display == f || e.style.display == fw) ? "" : "no-"+f; 
    } catch(e) { 
        c = "no-"+f;
    }
    if(c){
        d.documentElement.className = (cl) ? cl+" "+c : c;
    }
})(document);