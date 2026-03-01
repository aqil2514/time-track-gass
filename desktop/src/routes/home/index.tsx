import { Title } from "../../components/typograph/title";
import MainContainer from "../../components/containers/main-container";
import { TimeTrackerController } from "./components/controller";
import { Separator } from "@/components/ui/separator";
import { useFetch } from "@/hooks/use-fetch";
import { buildUrl } from "@/utils/build-url";
import { LoadingSpinner } from "@/components/atoms/loading-spinner";
import { DataTable } from "@/components/organisms/data-table";
import { columnDef } from "./components/columnsDef";
import { AIScreenReportDb } from "./types/ai-record.type";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MutateButton } from "@/components/atoms/mutate-button";

export default function HomeTemplate() {
  const url = buildUrl("image-upload");
  const { data, isLoading, mutate } = useFetch<AIScreenReportDb[]>(url);

  return (
    <MainContainer className="space-y-4">
      <Title title="Time Tracker" />
      <Separator />
      <TimeTrackerController mutate={mutate} data={data ?? []} />
      <Separator />
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Data Hasil AI</CardTitle>
            <CardAction>
              <MutateButton mutate={mutate} />
            </CardAction>
          </CardHeader>
          <CardContent>
            <DataTable columns={columnDef} data={data ?? []} />
          </CardContent>
        </Card>
      )}
    </MainContainer>
  );
}
