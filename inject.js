// Author    : Shen Xiaolong( xlshen2002@hotmail.com , xlshen@126.com )
// Copyright : free use,modify,spread, but MUST include this original two line information(Author and Copyright).
// this js need support of localAppLoader.bat :  https://github.com/shenxiaolong-code/DailyWorkHub

console.log(document.URL + " , xiaolong's chrome extension is loaded! ...... ");

// setup document sub-node add event listener.
observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        for (var i = 0; i < mutation.addedNodes.length; i++)
        document_subNode_add_callback_func(mutation.addedNodes[i]);
    })
});


inject_entry();

// -------------------------------------- load complete ---------------------------------------------------------------------------
function inject_entry()
{
    if(isInExcludedList(document.URL))
    {
        console.log("processing special url : " + document.URL );
        process_link_A_special();
    }
    else
    {
        // alert(" [debug]  xiaolong's chrome extension is loaded in function inject_entry . ");    
        console.log("function inject_entry in inject.js is loaded! ...... ");
        create_all_auto_elements_in_body();
        process_link_A();
        update_TxtColor_element();

        // monitor dynamic loaded.
        console.log("start event listener for adding link node ...... ");
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }    
}

function isInExcludedList(url)
{
    const excludeList = ["gitlab-master.nvidia.com", "jirasw.nvidia.com","blossom.nvidia.com"];
    for (const x of excludeList) { 
        if (url.includes(x))
        {
            return true;
        }
    }

    return false;
}

function isFilterNode(node)
{
    if ("A" == node.nodeName)
    {
        return true;
    }

    return false;
}

function process_added_node(node)
{
    if (isFilterNode(node)) 
    {
        console.log(node.href);
        process_one_link_A(node);
    }
    
    if (node.childElementCount > 0)
    {
        const matches = node.querySelectorAll('a')
        matches.forEach(function (subNode) {
            process_one_link_A(subNode);
        });
        // for (var i = 0; i < node.childElementCount; i++) {
        //     process_added_node(node.childNodes[i]);
        // }
    }
}

function document_subNode_add_callback_func(node)
{
    if ("#text" == node.nodeName) {
        return;
    }
    console.log(node.nodeName + " : document sub node is added into document. ...... ");
    process_added_node(node);
}

function update_TxtColor_element()
{
    const matches = document.querySelectorAll('[TxtColor]');
    matches.forEach(function (node) {
        update_TxtColor_element_one_node(node);
    });
}

function update_TxtColor_element_one_node(node)
{
    if (!node) return;

    // example : <B class="TxtColor"> xxxx </B>
    // TxtColor =  "<B class=\"TxtColor\">"  + node.innerHTML + "</B>";
    TxtColor = "<B style=\"color: red\">" + node.innerHTML + "</B>";
    node.innerHTML = TxtColor;
}

function create_all_auto_elements_in_body()
{
    const matches = document.querySelectorAll('[localUrl]');
    matches.forEach(function (node) {
        set_path_to_node(node, node.getAttribute("localUrl"), !node.getAttribute("oneLine"));
    });
}


function set_path_to_node(node,localUrl,bHasBr=true)
{
    if (!node) return;

    if ( -1 != localUrl.lastIndexOf('#') )
    {
        localUrl = localUrl.substring(0, localUrl.lastIndexOf('#'));
    }

    var localFolder = localUrl.substring(0, localUrl.lastIndexOf('/') + 1);
    var fileName  = localUrl.substring(localUrl.lastIndexOf('/') + 1);
    var innerText = node.innerText.trim();
    if(!innerText)
    {
        innerText = fileName;
    }
    else
    {
        node.innerText=""
    }

    var htmlStream = "<a href=\"" + localUrl + "\" ><h3 style=\"display: inline;\">" + innerText + "</h3></a>";
    if (bHasBr) {
        htmlStream += "<br>";
    }
    else
    {
        htmlStream += "&nbsp;&nbsp;";
    }
    
    node.innerHTML = htmlStream + node.innerHTML;
    node.setAttribute("style","display: inline-block");         // now new line
}

function open_link_url_in_new_tab(node)
{
    // alert(node.href);
    // https://www.geeksforgeeks.org/how-to-open-url-in-new-tab-using-javascript/
    window.open(node.href, "_blank");                           // open url in new tab
    return false;
}

function process_link_A_special()
{
    const matches = document.querySelectorAll('a[class="issue-link"]')
    matches.forEach(function (node) {
        // https://stackoverflow.com/questions/1265887/call-javascript-function-on-hyperlink-click
        // process_one_link_A(node);
        // node.onclick = process_link_A_special_click;
        node.onclick = function() { open_link_url_in_new_tab(node)  ; return false ; }
    });
}

function process_link_A()
{
    const matches = document.querySelectorAll('a')
    matches.forEach(function (node) {
        process_one_link_A(node);
    });
}

function process_one_link_A(node)
{
    if(!node.href) return ;
    
    // console.log("A node.innerText = " + node.innerText);
    // if(node.innerHTML.startsWith(""))
    // {
    //     console.log("[debug] empty innerText or innerHTML!");
    // }
    // if(node.innerText.startsWith("Meta"))
    // {
    //     console.log("[debug] empty innerText or innerHTML!");
    // }

    if (!node.innerText.trim()) 
    {
        if (!node.innerHTML.trim() && !node.innerText.trim())
        {   // A link content might be picture or other elements
            node.innerText = node.href.trim();
        }
    }
    else
    {
        node.innerText = node.innerText.trim();       
    }

    if (node.href.startsWith('http'))
    {
        // because current no any browser supports css3 : target-new:tab
        // here workaround to open the link in new tab which has not specified the "target" attribute.
        // https://www.w3schools.com/cssref/css3_pr_target-new.asp
        // if( !node.getAttribute("href").startsWith("localLoader:") && !node.getAttribute("target") && !node.hasAttribute("noNew")) 
        // window.open(node.href, "_blank");                           // open url in new tab
        node.setAttribute("target", "_blank");
        return;
    }

    if (node.href.startsWith('file:///'))
    {
        process_link_A_local_path(node);
        return;
    }

    console.log( node.href + " is loaded ...... ");
}

function process_link_A_local_path(node)
{   // url begin with : file:///
    if(!node.href) return ;

    // window local directory page
    var attr=node.getAttribute('class');
    if( attr )
    {
        if("icon file"  == attr)    process_link_A_local_html_file(node);
        if("icon dir"   == attr)    process_link_A_local_html_folder(node);
        if("icon up"    == attr)    process_link_A_local_html_parent_folder(node);
        return;
    }

    process_link_A_local_path_customized(node);
}

function process_link_A_local_path_customized(node)
{
    if (!node.href) return;    
    
    var localPath = node.href.substring(8);
    var isFolder = (localPath.slice(-1)=='/') ? 1 : 0 ;
    if (isFolder) 
    {
        return;
    }

    var fileHtml = "[" ;
    var bAddEdit = node.hasAttribute("editable");
    if(!node.hasAttribute("class") && !bAddEdit)
    {
        const exts = [".txt", ".bat", ".cmd"];
        bAddEdit = exts.includes(node.href.slice(-4)) ? 1 : 0; 
    }
    if(bAddEdit)
    {
        fileHtml += "<a style=\"color:rgb(120, 18, 216);text-decoration:none\" title=\"edit file : " + localPath + "\" style=\"text-decoration: none\" href=\"localLoader://editFile:" + localPath + "\"> @ </a>&nbsp;"            
    }

    var folderPath = localPath.substring(0,localPath.lastIndexOf('/'));
    fileHtml += "<a class=\"folderIcon\" style=\"color:rgb(120, 18, 216);text-decoration:none\" title=\"open foler : " + folderPath + "\" style=\"text-decoration: none\" href=\"" + folderPath + "\"> dir </a>]&nbsp;&nbsp;"  

    node.insertAdjacentHTML("afterend", fileHtml);
}

function pathCanOpen(localPath)
{
    if( -1 != localPath.lastIndexOf(' '))
    {
        return false;
    }

    if( -1 != localPath.lastIndexOf('&'))
    {
        return false;
    }

    if( -1 != localPath.lastIndexOf('%'))
    {
        return false;
    }

    return true;
}

function genMsSearchString(fileLocalPath)
{
    var newHref = "search-ms:query=";
    newHref += fileLocalPath.substring(fileLocalPath.lastIndexOf('/') + 1);
    newHref += "&crumb=location:";
    newHref += fileLocalPath.substring(0, fileLocalPath.lastIndexOf('/')).replaceAll('/', '\\');
    newHref += "&"
    // file:///C:/work/nviddia/project_note/cuDNN%20v8%20backend%20API%20Introduction.pptx
    // =>
    // expected : search-ms:query=cuDNN%20v8%20backend%20API%20Introduction.pptx&crumb=location:C:\work\nviddia\project_note&
    return newHref;
}

function appendInfo(node, localPath, isFile=false)
{
    // htmlStream = "<B style=\"color: red\">" + node.innerHTML + "</B>";
    // var htmlStream = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<B style=\"color: red\">path include unsupported char</B>"; 
    var htmlStream = "&nbsp;&nbsp;&nbsp;&nbsp;";
    if(isFile)
    {
        // htmlStream += "<a href=\"search-ms:query=cuDNN%20v8%20backend%20API%20Introduction.pptx&crumb=location:C:\\work\\nviddia\\project_note&\"> OKExample </a> &nbsp;&nbsp;&nbsp;&nbsp; ";
        htmlStream += "<a href=\"" + genMsSearchString(localPath) +"\"> explorer locate </a> &nbsp;&nbsp;&nbsp;&nbsp; ";        
    }
    htmlStream += "<button onclick='(function(){ navigator.clipboard.writeText(\"" + localPath + "\") ; \
    alert(\"path is copied into current system clipboard:\\r\\n" + localPath + "\");  ; })();' > <B style=\"color: red\">copy unsupported path to clipboard  </B></button>";
    node.innerHTML = node.innerHTML + htmlStream ;    
}

function process_link_A_local_html_file(node)
{
    // node.innerText = "updated: " + node.innerText;
    var fileType=node.href.substring(node.href.lastIndexOf('.'));
    if(fileType.length > 0 && fileType[0] != ".")
    {   // filter no extension name
        fileType = "";
    }

    // node.innerText = fileType+ " : " + node.innerText;
    var fileLocalPath=node.href.substring(8);    
    if(!pathCanOpen(fileLocalPath))
    {
        appendInfo(node.parentNode.parentNode,fileLocalPath,true);
        // node.href = "localLoader://openFolder:"+fileLocalPath.substring(0,fileLocalPath.lastIndexOf('/')+1);        
        // node.href = genMsSearchString(fileLocalPath);
        return;
    }

    var htmlStream = "<td>";           
    htmlStream += " &nbsp;&nbsp;&nbsp;&nbsp; <a href=\"localLoader://locatePath:" + fileLocalPath + "\"> explorer locate </a></td><td>";        

    // let fileEditArray = ['.bat','.cmd','.txt','.ini'];
    if ( ['.bat','.cmd','.txt','.ini'].includes(fileType) ) 
    {
        node.innerText=node.innerText.trim();
        htmlStream += " &nbsp;&nbsp;&nbsp;&nbsp; <a href=\"localLoader://editFile:" + fileLocalPath + "\">edit</a>";        
    } 
    else if(  ['.doc','.pptx','.xlsx','.code-workspace','.msg','.sln','.exe','.msi'].includes(fileType) )
    {
        node.href = "localLoader://openFile:" + fileLocalPath;
    } 
    else if(  ['.zip','.tar','.gz'].includes(fileType) )
    {
        node.href = "localLoader://locatePath:" + fileLocalPath;
    }
    else
    {
        htmlStream += " &nbsp;&nbsp;&nbsp;&nbsp; <a href=\"localLoader://openFile:" + fileLocalPath + "\"> defaultOpen </a> </td><td>"; 
        htmlStream += " &nbsp;&nbsp;&nbsp;&nbsp; <a href=\"localLoader://vscodeOpen:" + fileLocalPath + "\"> vscodeEdit </a>";                
    }
    htmlStream += " </td>";
    
    node.parentNode.parentNode.innerHTML = node.parentNode.parentNode.innerHTML + htmlStream;
}

function process_link_A_local_html_folder(node)
{   
    var folderLocalPath=node.href.substring(8);    
    if(!pathCanOpen(folderLocalPath))
    {
        appendInfo(node.parentNode.parentNode,folderLocalPath);
        return;
    }

    var htmlStream = "<td>";
    htmlStream += " &nbsp;&nbsp;&nbsp;&nbsp; <a href=\"localLoader://vscodeOpen:" + folderLocalPath + "\"> vscodeOpen </a> </td><td>";        
    htmlStream += " &nbsp;&nbsp;&nbsp;&nbsp; <a href=\"localLoader://openFolder:" + folderLocalPath + "\"> explorer Open </a> </td>";    
    htmlStream += " </td>";    
    
    node.parentNode.parentNode.innerHTML = node.parentNode.parentNode.innerHTML + htmlStream;
}

function process_link_A_local_html_parent_folder(node)
{
    var folderLocalPath = document.location.pathname.substring(1,document.location.pathname.length);  
    if(!pathCanOpen(folderLocalPath))
    {
        appendInfo(node.parentNode,folderLocalPath);
        return;
    }
    
    var htmlStream = " &nbsp;&nbsp;&nbsp;&nbsp; <a href=\"localLoader://openFolder:" + folderLocalPath + "\">explorer Open</a> ";
    htmlStream += " &nbsp;&nbsp;&nbsp;&nbsp; <a href=\"localLoader://vscodeOpen:" + folderLocalPath + "\"> vscodeOpen </a> ";
    htmlStream += " &nbsp;&nbsp;&nbsp;&nbsp; <a href=\"localLoader://searchFile:" + folderLocalPath + "\"> search file </a> ";        
    htmlStream += " &nbsp;&nbsp;&nbsp;&nbsp; <a href=\"localLoader://searchContent:" + folderLocalPath + "\"> search content </a> ";        
    node.parentNode.innerHTML = node.parentNode.innerHTML + htmlStream;
}