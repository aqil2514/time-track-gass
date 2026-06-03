import { Button } from "@/components/ui/button";
import { useDivisionContext } from "../../provider/divisions.provider";

export function DivisionAddButton() {
  const { dispatch } = useDivisionContext();

  const clickHandler = () =>
    dispatch({ type: "UPDATE_OPENED_MODAL", payload: { state: "add" } });
  return <Button onClick={clickHandler}>Tambah Divisi Baru</Button>;
}
