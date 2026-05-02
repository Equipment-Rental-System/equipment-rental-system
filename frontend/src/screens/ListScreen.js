import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import BottomTab from "../components/BottomTab";
import Header from "../components/Header";
import Page from "../components/Page";
import PrimaryButton from "../components/PrimaryButton";
import StatusBadge from "../components/StatusBadge";
import { styles } from "../styles/appStyles";

export default function ListScreen({
  items,
  loading,
  onBack,
  onSelectItem,
  onGoHome,
  onGoMyPage,
}) {
  return (
    <Page>
      <Header title="기자재 목록" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.listScroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loaderCard}>
            <ActivityIndicator color="#2f89ef" />
            <Text style={styles.loaderText}>기자재 정보를 불러오는 중입니다.</Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.listCard}>
              <View style={styles.listThumb}>
                <Image source={item.imageSource} style={styles.listThumbImage} resizeMode="contain" />
              </View>
              <View style={styles.listBody}>
                <Text style={styles.listName}>{item.name}</Text>
                <Text style={styles.listCode}>{item.code}</Text>
                <Text style={styles.listLocation}>{item.location}</Text>
              </View>
              <View style={styles.listSide}>
                <StatusBadge status={item.status} />
                <PrimaryButton
                  label="대여하기"
                  compact
                  disabled={item.status !== "AVAILABLE"}
                  onPress={() => onSelectItem(item)}
                />
              </View>
            </View>
          ))
        )}
      </ScrollView>
      <BottomTab
        current="rent"
        onChange={(key) => {
          if (key === "home") onGoHome();
          if (key === "mypage") onGoMyPage();
        }}
      />
    </Page>
  );
}
