import { ConfigProvider } from "antd";
import Tables from "./components/Table";
import { HospitalLists } from "./components/Lists";
import { HospitalProvider } from "./context/HospitalContext";
import data from "./data/database.json";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen pb-20 gap-32 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="font-extrabold text-4xl">جدول الرغبات</h1>
      <ConfigProvider direction="rtl">
        <HospitalProvider>
          <div className="w-full max-w-6xl mx-auto">
            <HospitalLists data={data.cities} />
            <Tables />
          </div>
        </HospitalProvider>
      </ConfigProvider>
    </div>
  );
}
