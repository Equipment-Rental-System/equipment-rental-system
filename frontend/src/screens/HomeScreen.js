import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import BottomTab from "../components/BottomTab";
import InfoBanner from "../components/InfoBanner";
import Page from "../components/Page";
import StatusBadge from "../components/StatusBadge";
import { CATEGORY_META } from "../constants/appConstants";
import { styles } from "../styles/appStyles";

export default function HomeScreen({
  items,
  loading,
  onOpenList,
  onOpenMyPage,
  onLogout,
}) {
  return (
    <Page>
      <View style={styles.topBrandRow}>
        <Text style={styles.brand}>4 EQUIP</Text>
        <Pressable style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </Pressable>
      </View>

      <View style={styles.bannerWrap}>
        <InfoBanner text="화면 디자인은 단순하게 유지하고, 로그인과 기자재 대여 흐름에 집중한 작업본입니다." />
      </View>

      <ScrollView contentContainerStyle={styles.homeScroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loaderCard}>
            <ActivityIndicator color="#2f89ef" />
            <Text style={styles.loaderText}>기자재 목록을 불러오는 중입니다.</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.loaderCard}>
            <Text style={styles.loaderText}>불러온 기자재가 없습니다.</Text>
          </View>
        ) : (
          items.map((item) => (
            <Pressable key={item.id} style={styles.homeCard} onPress={onOpenList}>
              <View style={styles.homeCardHeader}>
                <StatusBadge status={item.status} />
                <Text style={styles.cardCategory}>{CATEGORY_META[item.category]?.badge || "기기"}</Text>
              </View>
              <View style={styles.cardImageWrap}>
                <Image source={item.imageSource} style={styles.cardImage} resizeMode="contain" />
              </View>
              <Text style={styles.cardTitle}>{item.name}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>

      <BottomTab
        current="home"
        onChange={(key) => {
          if (key === "rent") onOpenList();
          if (key === "mypage") onOpenMyPage();
        }}
      />
    </Page>
  );
}
