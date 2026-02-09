function get(key){
    return JSON.parse(localStorage.getItem(key)) || [];
}

function set(key,data){
    localStorage.setItem(key, JSON.stringify(data));
}

function resetAll(){
    if(confirm("Delete all data?")){
        localStorage.clear();
        location.reload();
    }
}
