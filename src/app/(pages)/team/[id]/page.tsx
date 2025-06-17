// src/app/(pages)/team/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  Avatar,
  Typography,
  Tag,
  Button,
  Space,
  Row,
  Col,
  Divider,
  Spin,
  Alert,
  Breadcrumb,
  Tooltip,
  BackTop,
} from "antd";
import {
  UserOutlined,
  GithubOutlined,
  LinkedinOutlined,
  MailOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  StarOutlined,
  HomeOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { getTeamById, Team } from "@/services/teamService";

const { Title, Paragraph, Text } = Typography;
const { Meta } = Card;

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const teamId = params.id as string;

  useEffect(() => {
    if (teamId) {
      loadTeamDetail();
    }
  }, [teamId]);

  const loadTeamDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getTeamById(teamId);

      if (result) {
        setTeam(result);
      } else {
        setError("ไม่พบข้อมูลสมาชิกทีมที่ต้องการ");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      console.error("Error loading team detail:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-4">
            <Text type="secondary">กำลังโหลดข้อมูลสมาชิกทีม...</Text>
          </div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Alert
            message="เกิดข้อผิดพลาด"
            description={error}
            type="error"
            showIcon
            action={
              <Space>
                <Button size="small" onClick={loadTeamDetail}>
                  ลองอีกครั้ง
                </Button>
                <Button size="small" onClick={() => router.push("/team")}>
                  กลับไปหน้าทีมงาน
                </Button>
              </Space>
            }
          />
        </div>
      </div>
    );
  }

  const contactMethods = [
    {
      icon: <MailOutlined />,
      label: "อีเมล",
      value: team.email,
      href: team.email ? `mailto:${team.email}` : undefined,
      color: "#1890ff",
    },
    {
      icon: <GithubOutlined />,
      label: "GitHub",
      value: team.github_url,
      href: team.github_url,
      color: "#24292e",
    },
    {
      icon: <LinkedinOutlined />,
      label: "LinkedIn",
      value: team.linkedin_url,
      href: team.linkedin_url,
      color: "#0077b5",
    },
  ].filter((method) => method.value);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Breadcrumb */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-8 py-4">
          <Breadcrumb
            items={[
              {
                title: (
                  <span>
                    <HomeOutlined />
                    <span className="ml-1">หน้าแรก</span>
                  </span>
                ),
                href: "/home",
              },
              {
                title: (
                  <span>
                    <TeamOutlined />
                    <span className="ml-1">ทีมงาน</span>
                  </span>
                ),
                href: "/team",
              },
              {
                title: team.name,
              },
            ]}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* Back Button */}
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/team")}
          className="mb-6"
          size="large"
        >
          กลับไปหน้าทีมงาน
        </Button>

        <Row gutter={[32, 32]}>
          {/* Profile Card */}
          <Col xs={24} lg={8}>
            <Card className="text-center shadow-lg sticky top-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 mx-[-24px] mt-[-24px] mb-6 p-8">
                <Avatar
                  size={120}
                  src={team.avatar_url}
                  icon={<UserOutlined />}
                  className="border-4 border-white shadow-lg"
                />
              </div>

              <Title level={3} className="mb-2">
                {team.name}
              </Title>

              <Tag color="blue" className="mb-4 px-3 py-1 text-base">
                {team.position}
              </Tag>

              {/* Contact Methods */}
              {contactMethods.length > 0 && (
                <div className="mt-6">
                  <Divider orientation="left">
                    <Text strong>ช่องทางติดต่อ</Text>
                  </Divider>
                  <Space direction="vertical" size="middle" className="w-full">
                    {contactMethods.map((method, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center">
                          <span
                            style={{ color: method.color, fontSize: "18px" }}
                          >
                            {method.icon}
                          </span>
                          <Text className="ml-2 font-medium">
                            {method.label}
                          </Text>
                        </div>
                        {method.href ? (
                          <Button
                            type="link"
                            href={method.href}
                            target={
                              method.label !== "อีเมล" ? "_blank" : undefined
                            }
                            className="p-0 h-auto"
                          >
                            ติดต่อ
                          </Button>
                        ) : (
                          <Text type="secondary">-</Text>
                        )}
                      </div>
                    ))}
                  </Space>
                </div>
              )}

              {/* Join Date */}
              {team.created_at && (
                <div className="mt-6">
                  <Divider orientation="left">
                    <Text strong>เข้าร่วมทีม</Text>
                  </Divider>
                  <div className="flex items-center justify-center text-gray-600">
                    <CalendarOutlined className="mr-2" />
                    <Text>
                      {new Date(team.created_at).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Text>
                  </div>
                </div>
              )}
            </Card>
          </Col>

          {/* Details Section */}
          <Col xs={24} lg={16}>
            <Space direction="vertical" size="large" className="w-full">
              {/* About Section */}
              {team.description && (
                <Card title="เกี่ยวกับ" className="shadow-md">
                  <Paragraph className="text-base leading-relaxed text-gray-700">
                    {team.description}
                  </Paragraph>
                </Card>
              )}

              {/* Skills Section */}
              {team.skills && team.skills.length > 0 && (
                <Card
                  title={
                    <span>
                      <StarOutlined className="mr-2" />
                      ทักษะและความเชี่ยวชาญ
                    </span>
                  }
                  className="shadow-md"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {team.skills.map((skill, index) => (
                      <Tooltip key={index} title={`ทักษะ: ${skill}`}>
                        <Tag
                          color="geekblue"
                          className="px-4 py-2 text-center cursor-pointer hover:shadow-md transition-shadow"
                          style={{
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: "500",
                          }}
                        >
                          {skill}
                        </Tag>
                      </Tooltip>
                    ))}
                  </div>
                </Card>
              )}

              {/* Additional Info */}
              <Card title="ข้อมูลเพิ่มเติม" className="shadow-md">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <Text strong className="text-blue-700">
                        ตำแหน่ง
                      </Text>
                      <br />
                      <Text className="text-blue-600">{team.position}</Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <Text strong className="text-green-700">
                        จำนวนทักษะ
                      </Text>
                      <br />
                      <Text className="text-green-600">
                        {team.skills?.length || 0} ทักษะ
                      </Text>
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* Call to Action */}
              <Card className="shadow-md bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="text-center">
                  <Title level={4} className="text-blue-700 mb-4">
                    สนใจติดต่อทำงานร่วมกัน?
                  </Title>
                  <Paragraph className="text-gray-600 mb-6">
                    หากคุณมีโปรเจคที่น่าสนใจหรือต้องการความช่วยเหลือในด้านที่เกี่ยวข้อง
                  </Paragraph>
                  <Space size="middle">
                    {team.email && (
                      <Button
                        type="primary"
                        size="large"
                        icon={<MailOutlined />}
                        href={`mailto:${team.email}`}
                      >
                        ส่งอีเมล
                      </Button>
                    )}
                    <Button size="large" onClick={() => router.push("/team")}>
                      ดูทีมงานอื่น
                    </Button>
                  </Space>
                </div>
              </Card>
            </Space>
          </Col>
        </Row>
      </div>

      <BackTop />
    </div>
  );
}
