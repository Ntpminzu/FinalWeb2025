import { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

export default function DescriptionEditor({ initialValue = '', onChange }) {
  const container = useRef(null);
  const change = useRef(onChange);
  change.current = onChange;
  useEffect(() => {
    const host = document.createElement('div');
    container.current.appendChild(host);
    const editor = new Quill(host, {
      theme: 'snow',
      placeholder: 'Nhập mô tả chi tiết khóa học...',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ header: [1, 2, false] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'blockquote', 'code-block'],
          ['clean'],
        ],
      },
    });
    editor.setText(initialValue);
    editor.root.setAttribute('aria-label', 'Mô tả chi tiết');
    // Preserve the plain-text contract; never export or render editor HTML.
    const update = () => change.current(editor.getText().trim());
    editor.on('text-change', update);
    return () => {
      editor.off('text-change', update);
      container.current?.replaceChildren();
    };
  }, []);
  return <div ref={container} className="description-editor mb-3" />;
}
