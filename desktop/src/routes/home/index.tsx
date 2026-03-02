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
import { useAuth } from "@/hooks/use-auth";
import { Loading } from "@/components/layout/loading";
import { Navigate, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";

export default function HomeTemplate() {
  const url = buildUrl("image-upload");
  const { data, isLoading, mutate } = useFetch<AIScreenReportDb[]>(url);
  const navigate = useNavigate();

  const { loading, user } = useAuth();

  if (loading) return <Loading />;

  if (!user) return <Navigate to={"/login"} />;

  return (
    <MainContainer className="space-y-4">
      <div className="flex gap-4 justify-between">
        <Title title="Time Tracker" />
        <Button
          variant={"destructive"}
          onClick={() => {
            localStorage.removeItem("accessToken");
            navigate("/login");
          }}
        >
          Logout
        </Button>
      </div>
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
