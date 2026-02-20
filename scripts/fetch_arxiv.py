#!/usr/bin/env python3
"""
Fetch latest arXiv papers matching keywords and write JSON to output.
Uses only the Python standard library so it can run in GitHub Actions without extra deps.
"""
import argparse
import json
import sys
import time
from urllib.parse import quote_plus
from urllib.request import urlopen, Request
import xml.etree.ElementTree as ET

ATOM_NS = '{http://www.w3.org/2005/Atom}'


def fetch_arxiv(query, start=0, max_results=15):
    base = 'http://export.arxiv.org/api/query?'
    q = 'search_query=all:%s&start=%d&max_results=%d&sortBy=lastUpdatedDate&sortOrder=descending' % (
        quote_plus(query), start, max_results
    )
    url = base + q
    req = Request(url, headers={'User-Agent': 'arXiv-fetch-script/1.0'})
    with urlopen(req, timeout=30) as resp:
        if resp.status != 200:
            raise RuntimeError(f'HTTP {resp.status} from arXiv')
        data = resp.read()
    return data


def parse_feed(xml_bytes):
    root = ET.fromstring(xml_bytes)
    entries = []
    for e in root.findall(ATOM_NS + 'entry'):
        eid = e.find(ATOM_NS + 'id')
        title = e.find(ATOM_NS + 'title')
        summary = e.find(ATOM_NS + 'summary')
        updated = e.find(ATOM_NS + 'updated')
        authors = [a.find(ATOM_NS + 'name').text for a in e.findall(ATOM_NS + 'author') if a.find(ATOM_NS + 'name') is not None]
        pdf_url = None
        for link in e.findall(ATOM_NS + 'link'):
            if link.attrib.get('title') == 'pdf' or link.attrib.get('type') == 'application/pdf':
                pdf_url = link.attrib.get('href')
                break
        # fallback: convert abs to pdf
        if not pdf_url and eid is not None and eid.text:
            pdf_url = eid.text.replace('/abs/', '/pdf/') + '.pdf'

        entries.append({
            'id': eid.text if eid is not None else None,
            'title': (title.text.strip() if title is not None and title.text else '').replace('\n', ' '),
            'summary': (summary.text.strip() if summary is not None and summary.text else '').replace('\n', ' '),
            'updated': updated.text if updated is not None else None,
            'authors': authors,
            'pdf_url': pdf_url,
        })
    return entries


def main():
    p = argparse.ArgumentParser(description='Fetch arXiv to JSON')
    p.add_argument('--keywords', '-k', default='machine learning', help='Search keywords')
    p.add_argument('--max', '-m', type=int, default=15, help='Max results')
    p.add_argument('--output', '-o', default='docs/arxiv.json', help='Output JSON path')
    args = p.parse_args()

    try:
        xml = fetch_arxiv(args.keywords, max_results=args.max)
    except Exception as exc:
        print('Error fetching arXiv:', exc, file=sys.stderr)
        sys.exit(2)

    try:
        entries = parse_feed(xml)
    except Exception as exc:
        print('Error parsing arXiv feed:', exc, file=sys.stderr)
        sys.exit(3)

    # write JSON
    out = {'query': args.keywords, 'fetched_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'entries': entries}
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print('Wrote', args.output)


if __name__ == '__main__':
    main()
