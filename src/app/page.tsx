import { ConfigProvider, Layout } from "antd";
import Tables from "./components/Table";
import { HospitalLists } from "./components/Lists";
import { HospitalProvider } from "./context/HospitalContext";
import data from "./data/database.json";
import { Content } from "antd/es/layout/layout";

export default function Home() {
  return (
    <ConfigProvider direction="rtl">
      <Layout>
          <h1 className="font-extrabold text-4xl">جدول الرغبات</h1>
          <Content>
          <HospitalProvider>
            <div className="w-full max-w-6xl mx-auto">
              <HospitalLists data={data.cities} />
              <Tables />
            </div>
          </HospitalProvider>
          </Content>
        </Layout>
      </ConfigProvider>
  );
}
