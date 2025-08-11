import React from 'react';

interface RichTextNode {
  type: string;
  value?: string;
  url?: string;
  children?: RichTextNode[];
}

function renderNode(node: RichTextNode, key?: React.Key): React.ReactNode {
  const {type, value, url, children = []} = node;
  switch (type) {
    case 'root':
      return <div key={key}>{children.map((c, i) => renderNode(c, i))}</div>;
    case 'paragraph':
      return <p key={key}>{children.map((c, i) => renderNode(c, i))}</p>;
    case 'text':
      return <span key={key}>{value}</span>;
    case 'link':
      return (
        <a key={key} href={url} className="underline text-blue-700">
          {children.map((c, i) => renderNode(c, i))}
        </a>
      );
    case 'bold':
      return <strong key={key}>{children.map((c, i) => renderNode(c, i))}</strong>;
    case 'italic':
      return <em key={key}>{children.map((c, i) => renderNode(c, i))}</em>;
    case 'list':
      return <ul key={key} className="list-disc pl-6">{children.map((c, i) => renderNode(c, i))}</ul>;
    case 'list-item':
      return <li key={key}>{children.map((c, i) => renderNode(c, i))}</li>;
    case 'heading':
      return <h2 key={key} className="text-xl font-semibold">{children.map((c, i) => renderNode(c, i))}</h2>;
    default:
      return <span key={key}>{children.map((c, i) => renderNode(c, i))}</span>;
  }
}

export function RichText({json}: {json: string}) {
  try {
    const parsed = JSON.parse(json) as RichTextNode;
    return <div className="prose max-w-none">{renderNode(parsed)}</div>;
  } catch {
    return <div className="prose max-w-none whitespace-pre-wrap">{json}</div>;
  }
}
