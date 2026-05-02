import { Image, Pressable, ScrollView, Text, View } from "react-native";
import Header from "../components/Header";
import InputField from "../components/InputField";
import Page from "../components/Page";
import PrimaryButton from "../components/PrimaryButton";
import { QUICK_MEMOS } from "../constants/appConstants";
import { styles } from "../styles/appStyles";

export default function RentalDetailScreen({
  item,
  dueDate,
  memo,
  submitting,
  onChangeDueDate,
  onChangeMemo,
  onBack,
  onSubmit,
}) {
  return (
    <Page>
      <Header title="대여 신청 상세" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.detailCard}>
          <View style={styles.detailImageWrap}>
            <Image source={item.imageSource} style={styles.detailImage} resizeMode="contain" />
          </View>
          <Text style={styles.detailName}>{item.name}</Text>
          <Text style={styles.detailCode}>{item.code}</Text>
          <View style={styles.detailInfoBox}>
            <Text style={styles.detailInfoText}>상태: {item.statusLabel}</Text>
            <Text style={styles.detailInfoText}>보관 위치: {item.location}</Text>
            <Text style={styles.detailInfoText}>
              구성품: {item.components.length ? item.components.join(", ") : "미등록"}
            </Text>
          </View>
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>기자재 설명</Text>
          <Text style={styles.sectionBody}>{item.description}</Text>
        </View>

        <View style={styles.detailCard}>
          <InputField
            label="반납 예정일"
            value={dueDate}
            onChangeText={onChangeDueDate}
            placeholder="YYYY-MM-DD"
          />
          <InputField
            label="요청 메모"
            value={memo}
            onChangeText={onChangeMemo}
            placeholder="관리자에게 전달할 메모를 입력해주세요"
            multiline
          />
          <View style={styles.quickMemoRow}>
            {QUICK_MEMOS.map((quickMemo) => {
              const active = memo === quickMemo;

              return (
                <Pressable
                  key={quickMemo}
                  style={[styles.quickMemoChip, active && styles.quickMemoChipActive]}
                  onPress={() => onChangeMemo(quickMemo)}
                >
                  <Text style={[styles.quickMemoText, active && styles.quickMemoTextActive]}>
                    {quickMemo}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.submitWrap}>
          <PrimaryButton
            label={submitting ? "요청 중..." : "대여 신청 완료"}
            onPress={onSubmit}
            disabled={submitting}
          />
        </View>
      </ScrollView>
    </Page>
  );
}
