
const Ck = "AIzaSyBc1bRrOxmyPFFIMTuvxeUhqENUeG60pgY";
let paginaToken = "";
let prevToken = "";
let ultimaBusqueda ;



let formBuscar = document.getElementById("form");
let btnBuscar = document.getElementById("buscar");

async function ejecutarBusqueda() {
  let k = document.getElementById("aBuscar").blur();
  const musica = document.getElementById("aBuscar").value.trim();
  
  if (!musica) { 
    console.log("No se encuntra nada");
    return [];
  }
  else {
    paginaToken = ""
    let botones = document.getElementById("paginacion");
    
    mostrarMensaje("Buscando...",true);
    const ids = await Buscar(musica);
    const seve = await sePuedeVer(ids);
    mostrar(seve);
    if (botones.style.display === "none") botones.style.display = "block";
  }
  
  mostrarMensaje("", );
};

formBuscar.addEventListener("submit", (e) => {
  e.preventDefault();
  ejecutarBusqueda();
});

btnBuscar.addEventListener("click", (e) => {
  e.preventDefault();
  ejecutarBusqueda();
});



document.getElementById("siguiente").addEventListener("click", async () => {
  
  if (!ultimaBusqueda || !paginaToken) return;
    mostrarMensaje("Cargando siguiente página...",true);
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
    const ids = await Buscar(ultimaBusqueda, 24, paginaToken);
    const seve = await sePuedeVer(ids);
    mostrar(seve);
  mostrarMensaje("",)
});

document.getElementById("anterior").addEventListener("click", async () => {
  if (!ultimaBusqueda || !prevToken) return;
    mostrarMensaje("Cargando página anterior...", true);
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
    const ids = await Buscar(ultimaBusqueda, 24, prevToken);
    const seve = await sePuedeVer(ids);
    mostrar(seve);
  
 
  mostrarMensaje("", );
});


async function Buscar(cancion,maxResults=24, pageToken="") {
  if (!cancion) return [];
  
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${maxResults}&q=${encodeURIComponent(cancion)}&key=${Ck}${pageToken ? `&pageToken=${pageToken}` : ""}`);
  const data = await res.json();

  paginaToken = data.nextPageToken || "";
  prevToken = data.prevPageToken || "";
  ultimaBusqueda = cancion;
  
  if (!data.items) {
    return console.error("ERROR en busqueda ", data);
  } else {
    return data.items.map(v => ({
      id: v.id.videoId,
      titulo: v.snippet.title,
      canal: v.snippet.channelTitle,
      miniatura:v.snippet.thumbnails.high.url
    }))
  }
};

async function sePuedeVer(videoIds) {
  
  let ids = videoIds.map(d=> d.id);
  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status,contentDetails&id=${ids.join(",")}&key=${Ck}`)
  const data = await res.json();
  

  const valores = data.items
    .map(video => {
    const original = videoIds.find(v => v.id === video.id);
    return {
      id: video.id,
      titulo: original.titulo,
      canal: original.canal,
      miniatura: original.miniatura,
      embebible:video.status.embeddable &&
                        video.status.privacyStatus === "public" &&
                        !video.contentDetails.regionRestriction?.blocked
    }
  });
  return valores;
}

function mostrar(video) {
  let ul = document.getElementById("listResultado");
  ul.innerHTML = "";

  if (!video.length) {
    mostrarMensaje(" No se encontraron resultados válidos.",true);
    return;
  }
  mostrarMensaje("",);
  video.forEach(v => {
    let li = document.createElement("li");
    
    let titulo = document.createElement("p");

    titulo.textContent = v.titulo;
   
    if (v.embebible) {
      if (typeof YT !== "undefined" && YT.Player) {
        new YT.Player(frame.id, {
          events: {
            onError: (event) => {
              frame.remove();
              let msg = "";
              switch (event.data)
              {
                case 2: msg = "ID del video inválido.";
                  break;
                case 5: msg = "Error en reproducción del video.";
                  break;
                case 100: msg = "Video no existe o es privado.";
                  break;
                case 101:
                case 150: msg = `Este video no se puede reproducir en esta página. < a href = "https://www.youtube.com/watch?v=${v.id}" target = "_blank" > Ver en YouTube</a >`;
                  break;
                default: msg = "Error desconocido al reproducir el video.";
              }
              let aviso = document.createElement("p");
              aviso.innerHTML = msg;
              li.appendChild(aviso);
            }
          }
        });
      }
      li.appendChild(titulo);
      let thumb = document.createElement("img");
      thumb.src = v.miniatura;
      thumb.width = 300;
      thumb.height = 200;
      thumb.style.cursor = "pointer";
      li.appendChild(thumb);

      thumb.addEventListener("click", () => {
        let frame = document.createElement("iframe");
        frame.id = `player-${v.id}`;
        frame.width = 300;
        frame.height = 200;
        //
        frame.src = `https://www.youtube.com/embed/${v.id}?enablejsapi=1`;
        frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        frame.style.border = "none";
        frame.referrerPolicy = "strict-origin-when-cross-origin";
        frame.allowFullscreen = true;
        li.replaceChild(frame, thumb);
      })
      
    } else {
      
      let aviso = document.createElement("p");
      aviso.innerHTML = `No se puede reproducir en esta página. <a href="https://www.youtube.com/watch?v=${v.id}" target="_blank">Ver en YouTube</a>`;
      li.appendChild(aviso);
      
    }

    ul.appendChild(li);
    
  });
}

function mostrarMensaje(msg,estado) {
  if (estado) {
    let div = document.getElementById("carga");
    let p = document.createElement("p");
  
    p.id = "mensaje";
    p.textContent = msg;
    div.appendChild(p);
  }
  else {
    let div = document.getElementById("carga");
    let p = document.getElementById("mensaje");
    if (p && div.contains(p)) {  
      div.removeChild(p);
    }
  }
}

