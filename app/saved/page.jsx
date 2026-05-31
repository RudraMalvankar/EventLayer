import dynamic from "next/dynamic";

const SavedClient = dynamic(() => import("../../components/SavedClient"), {
  ssr: false,
});

export default function Page() {
  return <SavedClient />;
}
