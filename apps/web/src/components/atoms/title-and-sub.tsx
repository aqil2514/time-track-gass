interface Props {
  title: string;
  sub: string;
}

export function TitleAndSub({ sub, title }: Props) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
        {title}
      </h1>
      <p className="text-slate-500 text-sm">{sub}</p>
    </div>
  );
}
