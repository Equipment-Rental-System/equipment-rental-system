import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import BottomTab from "../components/BottomTab";
import InfoBanner from "../components/InfoBanner";
import Page from "../components/Page";
import StatusBadge from "../components/StatusBadge";
import { CATEGORY_META } from "../constants/appConstants";
import { styles } from "../styles/appStyles";

export default function HomeScreen({ items, loading, onOpenList, onOpenMyPage, onLogout }) {
  return (
    <Page>
      <View style={styles.topBrandRow}>
        <Text style={styles.brand}>동국대학교</Text>
        <Pressable style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </Pressable>
      </View>

      <View style={styles.bannerWrap}>
        <InfoBanner text="컴퓨터공학과 사무실 기자재를 모바일에서 조회하고 QR 인증 후 대여할 수 있습니다." />
      </View>

      <ScrollView contentContainerStyle={styles.homeScroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loaderCard}>
            <ActivityIndicator color="#2f89ef" />
            <Text style={styles.loaderText}>기자재 목록을 불러오는 중입니다.</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.loaderCard}>
            <Text style={styles.loaderText}>표시할 기자재가 없습니다.</Text>
          </View>
        ) : (
          items.map((item) => (
            <Pressable key={item.id} style={styles.homeCard} onPress={onOpenList}>
              <View style={styles.homeCardHeader}>
                <StatusBadge status={item.status} />
                <Text style={styles.cardCategory}>{CATEGORY_META[item.category]?.badge || "기자재"}</Text>
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
