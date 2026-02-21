export default function TodoList({ todos }: { todos: string[] }) {
  if (!todos.length) {
    return (
      <p className="text-sm text-[#a1a1aa]">할 일이 없습니다.</p>
    );
  }

  return (
    <div className="space-y-2">
      {todos.map((todo, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="text-[#a1a1aa] mt-0.5">☐</span>
          <span className="text-sm">{todo}</span>
        </div>
      ))}
    </div>
  );
}
