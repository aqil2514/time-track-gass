import { ContentContainer } from "@/components/containers/content-container";
import { DataTable } from "@/components/containers/data-table";
import {
  ProfileConfigProvider,
  useProfileConfig,
} from "@/features/attendance/provider/profile-config.provider";
import { useUserManagementColumns } from "./table/columns";
import { Button } from "@/components/ui/button";
import { useQueryParams } from "@/hooks/use-query-params";

export function AttendanceUserManagement() {
  return (
    <ProfileConfigProvider>
      <InnerTemplate />
    </ProfileConfigProvider>
  );
}

const InnerTemplate = () => {
  const { data } = useProfileConfig();
  const columns = useUserManagementColumns();

  const {} = useQueryParams()
  return (
    <>
      <ContentContainer
        title="Manajemen User"
        description="Manajemen User"
        rightElement={<Button variant={"accent"} size={"sm"}>Tambah Data</Button>}
      >
        <DataTable
          columns={columns}
          data={data ?? []}
          enableFiltering={true}
          enableSorting={true}
        />
      </ContentContainer>
    </>
  );
};
