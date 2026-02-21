// Simple client-side renderer for docs/arxiv.json with improved labels and timestamp formatting
(async function(){
  const container = document.getElementById('papers');
  if(!container) return;
  container.innerHTML = '<p>Loading papers…</p>';

  function formatToEST(iso){
    if(!iso) return '';
    try{
      const d = new Date(iso);
      const dtf = new Intl.DateTimeFormat('en', {
        timeZone: 'America/New_York',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short'
      });
      const parts = dtf.formatToParts(d);
      const map = {};
      parts.forEach(p => map[p.type] = p.value);
      // Build YYYY-MM-DD HH:MM TZ
      return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute} ${map.timeZoneName || ''}`.trim();
    }catch(e){
      return iso;
    }
  }

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

      const authorP = document.createElement('p');
      authorP.className = 'meta';
      authorP.innerHTML = '<strong>Author:</strong> ' + ((entry.authors || []).join(', ') || 'Unknown');
      card.appendChild(authorP);

      const updatedP = document.createElement('p');
      updatedP.className = 'meta';
      updatedP.textContent = formatToEST(entry.updated || '');
      card.appendChild(updatedP);

      const abs = document.createElement('p');
      abs.className = 'abstract';
      const txt = entry.summary || '';
      abs.innerHTML = '<strong>Abstract:</strong> ' + (txt.length>500 ? txt.slice(0,500)+'...' : txt);
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
