/**
 * 초경량 마크다운 → HTML 렌더 (의존성 0)
 * 옵시디언 노트 뷰어용. 헤딩/굵게/이탤릭/코드/링크/리스트/인용/체크박스/구분선.
 * XSS 방지: 먼저 HTML escape 후 마크다운 문법만 태그로 변환.
 */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(s: string): string {
  return esc(s)
    // 코드
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-[#1e1e30] text-[#f0abfc] text-[0.85em]">$1</code>')
    // 굵게
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    // 이탤릭
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    // 위키링크 [[..]]
    .replace(/\[\[([^\]]+)\]\]/g, '<span class="text-[#8b5cf6]">$1</span>')
    // 링크 [txt](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-[#60a5fa] underline">$1</a>');
}

export function renderMarkdown(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inCode = false;
  let codeBuf: string[] = [];
  let listOpen: "ul" | "ol" | null = null;

  const closeList = () => {
    if (listOpen) {
      out.push(`</${listOpen}>`);
      listOpen = null;
    }
  };

  for (const raw of lines) {
    const line = raw;

    // 코드펜스
    if (/^```/.test(line.trim())) {
      if (!inCode) {
        closeList();
        inCode = true;
        codeBuf = [];
      } else {
        inCode = false;
        out.push(
          `<pre class="my-2 p-3 rounded-lg bg-[#0d0d16] border border-[#1e1e30] overflow-x-auto text-[0.82em] leading-relaxed"><code>${esc(
            codeBuf.join("\n")
          )}</code></pre>`
        );
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    // 빈 줄
    if (!line.trim()) {
      closeList();
      continue;
    }

    // 헤딩
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      closeList();
      const lv = h[1].length;
      const sizes = ["text-xl", "text-lg", "text-base", "text-sm", "text-sm", "text-sm"];
      out.push(
        `<h${lv} class="${sizes[lv - 1]} font-bold text-white mt-4 mb-2 ${lv <= 2 ? "border-b border-[#1e1e30] pb-1" : ""}">${inline(h[2])}</h${lv}>`
      );
      continue;
    }

    // 구분선
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      closeList();
      out.push('<hr class="my-3 border-[#1e1e30]" />');
      continue;
    }

    // 인용
    if (/^>\s?/.test(line)) {
      closeList();
      out.push(
        `<blockquote class="border-l-2 border-[#8b5cf6] pl-3 my-2 text-[#a1a1aa]">${inline(line.replace(/^>\s?/, ""))}</blockquote>`
      );
      continue;
    }

    // 체크박스
    const cb = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/);
    if (cb) {
      if (listOpen !== "ul") {
        closeList();
        out.push('<ul class="my-1 space-y-0.5">');
        listOpen = "ul";
      }
      const done = cb[1].toLowerCase() === "x";
      out.push(
        `<li class="flex items-start gap-2 text-sm"><span>${done ? "☑" : "☐"}</span><span class="${done ? "line-through text-[#71717a]" : ""}">${inline(cb[2])}</span></li>`
      );
      continue;
    }

    // 순서없는 리스트
    const ul = line.match(/^\s*[-*+]\s+(.*)$/);
    if (ul) {
      if (listOpen !== "ul") {
        closeList();
        out.push('<ul class="my-1 ml-4 list-disc space-y-0.5">');
        listOpen = "ul";
      }
      out.push(`<li class="text-sm">${inline(ul[1])}</li>`);
      continue;
    }

    // 순서 리스트
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ol) {
      if (listOpen !== "ol") {
        closeList();
        out.push('<ol class="my-1 ml-4 list-decimal space-y-0.5">');
        listOpen = "ol";
      }
      out.push(`<li class="text-sm">${inline(ol[1])}</li>`);
      continue;
    }

    // 일반 문단
    closeList();
    out.push(`<p class="my-1.5 text-sm leading-relaxed text-[#d4d4d8]">${inline(line)}</p>`);
  }
  closeList();
  if (inCode && codeBuf.length) {
    out.push(`<pre class="my-2 p-3 rounded-lg bg-[#0d0d16] overflow-x-auto text-[0.82em]"><code>${esc(codeBuf.join("\n"))}</code></pre>`);
  }
  return out.join("\n");
}
