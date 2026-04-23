import { Text, View, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import BottomTab from "../components/BottomTab";
import Header from "../components/Header";
import Page from "../components/Page";
import StatusBadge from "../components/StatusBadge";
import { styles } from "../styles/appStyles";

export default function MyPageScreen({ user, rentals, onBack, onGoHome }) {
  return (
    <Page>
      <Header title="마이페이지" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.myScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name="account" size={34} color="#2f89ef" />
          </View>
          <View style={styles.profileBody}>
            <Text style={styles.profileName}>{user?.name || "사용자"}</Text>
            <Text style={styles.profileMeta}>학번: {user?.studentId || "-"}</Text>
            <Text style={styles.profileMeta}>{user?.department || "학과 정보 없음"}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{rentals.length}</Text>
            <Text style={styles.summaryLabel}>진행 중 요청</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{user?.role || "USER"}</Text>
            <Text style={styles.summaryLabel}>계정 권한</Text>
          </View>
        </View>

        <View style={styles.panelCard}>
          <Text style={styles.sectionTitle}>내 대여 현황</Text>
          {rentals.length ? (
            rentals.map((rental) => (
              <View key={rental.id} style={styles.rentalRow}>
                <View style={styles.rentalTextWrap}>
                  <Text style={styles.rentalTitle}>{rental.title}</Text>
                  <Text style={styles.rentalSub}>{rental.code}</Text>
                  <Text style={styles.rentalSub}>{rental.period}</Text>
                </View>
                <StatusBadge
                  status={
                    rental.status === "REQUESTED"
                      ? "RENTAL_PENDING"
                      : rental.status === "APPROVED"
                        ? "RENTED"
                        : rental.status
                  }
                />
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>아직 대여 요청 내역이 없습니다.</Text>
          )}
        </View>
      </ScrollView>
      <BottomTab
        current="mypage"
        onChange={(key) => {
          if (key === "home") onGoHome();
        }}
      />
    </Page>
  );
}
