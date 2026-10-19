// One application: serves the game and multiplayer rooms from the same address.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {WebSocketServer, WebSocket} = require('ws');
const root=__dirname, port=Number(process.env.PORT||8080);
const rooms=new Map();
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.wasm':'application/wasm'};
const server=http.createServer((req,res)=>{
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end()}
 let url;try{url=new URL(req.url,'http://localhost')}catch{res.writeHead(400);return res.end()}
 if(url.pathname==='/health'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify({ok:true,rooms:rooms.size}))}
 let name;try{name=decodeURIComponent(url.pathname)}catch{res.writeHead(400);return res.end()}
 if(name==='/'||name==='/index.html')name='/index.html';
 // Public assets are mapped from /models/... to public/models/...
 const relative=name.startsWith('/models/')||name.startsWith('/images/')||name.startsWith('/audio/')||name.startsWith('/textures/')||name.startsWith('/maps/')?'public'+name:name.slice(1);
 const file=path.resolve(root,relative);
 if(!(file===path.join(root,'index.html')||file.startsWith(path.join(root,'public')+path.sep))){res.writeHead(403);return res.end()}
 fs.stat(file,(err,st)=>{if(err||!st.isFile()){res.writeHead(404);return res.end('Not found')}
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':file.endsWith('.html')?'no-cache':'public, max-age=3600'});
 if(req.method==='HEAD')return res.end();fs.createReadStream(file).pipe(res);
 });
});
const wss=new WebSocketServer({server,path:'/ws',maxPayload:150000});
const send=(ws,obj)=>{if(ws?.readyState===WebSocket.OPEN)ws.send(JSON.stringify(obj))};
const code=()=>crypto.randomBytes(4).toString('hex').toUpperCase();
wss.on('connection',ws=>{
 ws.on('message',buf=>{
 let m;try{m=JSON.parse(buf.toString())}catch{return}
 if(!m||typeof m.type!=='string')return;
 if(m.type==='ping'){send(ws,{type:'pong',at:Date.now()});return;}
 if(m.type==='create'){
  let id=code();while(rooms.has(id))id=code();rooms.set(id,{host:ws,guest:null,created:Date.now()});ws.room=id;ws.role='host';send(ws,{type:'created',room:id});return;
 }
 if(m.type==='join'){
  const id=String(m.room||'').toUpperCase().slice(0,8),r=rooms.get(id);
  if(!r||r.guest||r.host.readyState!==WebSocket.OPEN){send(ws,{type:'error',message:'الغرفة غير متاحة'});return}
  r.guest=ws;ws.room=id;ws.role='guest';send(ws,{type:'joined',room:id});send(r.host,{type:'peer_joined'});return;
 }
 const r=rooms.get(ws.room);if(!r)return;
 if(m.type==='snapshot'&&ws.role==='host'&&r.guest){send(r.guest,{type:'snapshot',state:m.state});return}
 if(m.type==='command'&&ws.role==='guest'&&r.host){if(JSON.stringify(m).length<2000)send(r.host,{type:'command',cmd:m.cmd});return}
 if(m.type==='start'&&ws.role==='host'&&r.guest){send(r.guest,{type:'start'});return}
 });
 ws.on('close',()=>{const r=rooms.get(ws.room);if(!r)return;if(ws.role==='host'){send(r.guest,{type:'peer_left'});rooms.delete(ws.room)}else if(ws.role==='guest'){r.guest=null;send(r.host,{type:'peer_left'})}});
});
setInterval(()=>{for(const [id,r] of rooms){if(Date.now()-r.created>4*3600000){send(r.host,{type:'error',message:'انتهت صلاحية الغرفة'});send(r.guest,{type:'error',message:'انتهت صلاحية الغرفة'});rooms.delete(id)}}},60000).unref();
server.listen(port,'0.0.0.0',()=>console.log('Generals Mobile: http://localhost:'+port));
