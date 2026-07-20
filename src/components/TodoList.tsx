import type { TodoItem } from "@/lib/types";

function todoText(t: TodoItem): string {
  return typeof t === "string" ? t : t?.text ?? "";
}
function todoDone(t: TodoItem): boolean {
  return typeof t === "string" ? false : !!t?.done;
}

export default function TodoList({ todos }: { todos: TodoItem[] }) {
  if (!todos.length) {
    return <p className="text-sm text-[#a1a1aa]">할 일이 없습니다.</p>;
  }

  return (
    <div className="space-y-2">
      {todos.map((todo, i) => {
        const done = todoDone(todo);
        return (
          <div key={i} className="flex items-start gap-2">
            <span className="text-[#a1a1aa] mt-0.5">{done ? "☑" : "☐"}</span>
            <span className={`text-sm ${done ? "line-through text-[#71717a]" : ""}`}>
              {todoText(todo)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
