export default function Card({ title, children }) {
  return (
    <div style={{ border: "1px solid gray", padding: "10px" }}>
      <h3>{title}</h3>
      {children}
    </div>
  );
}
