// Simple client-side renderer for docs/arxiv.json
(async function(){
  const container = document.getElementById('papers');
  if(!container) return;
  container.innerHTML = '<p>Loading papers…</p>';
  try{
    const resp = await fetch('arxiv.json');
    if(!resp.ok) throw new Error('HTTP '+resp.status);
    const data = await resp.json();
    const list = document.createElement('div');
    list.className = 'arxiv-list';
    if(!Array.isArray(data.entries) || data.entries.length === 0){
      container.innerHTML = '<p>No papers found.</p>';
      return;
    }
    data.entries.forEach(entry => {
      const card = document.createElement('article');
      card.className = 'paper';
      const title = document.createElement('h3');
      const a = document.createElement('a');
      a.href = entry.id || '#';
      a.textContent = entry.title || 'Untitled';
      a.target = '_blank';
      title.appendChild(a);
      card.appendChild(title);
      const meta = document.createElement('p');
      meta.className = 'meta';
      meta.textContent = (entry.authors || []).join(', ') + ' — ' + (entry.updated || '');
      card.appendChild(meta);
      const abs = document.createElement('p');
      abs.className = 'abstract';
      const txt = entry.summary || '';
      abs.textContent = txt.length>500 ? txt.slice(0,500)+'...': txt;
      card.appendChild(abs);
      if(entry.pdf_url){
        const pdf = document.createElement('p');
        const link = document.createElement('a');
        link.href = entry.pdf_url;
        link.textContent = 'PDF';
        link.target = '_blank';
        pdf.appendChild(link);
        card.appendChild(pdf);
      }
      list.appendChild(card);
    });
    container.innerHTML = '';
    container.appendChild(list);
  }catch(err){
    container.innerHTML = '<p>Failed to load papers: '+(err.message||err)+'</p>';
  }
})();
