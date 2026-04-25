import argparse
import requests
from scapy.all import DNSQR, IP, sniff

API_URL = "http://localhost:5000/api/monitor/alerts"
MONITOR_KEY = "monitor-key"

def send_alert(ip_address, mac_address, domain):
    payload = {
        "ipAddress": ip_address,
        "macAddress": mac_address,
        "domainAccessed": domain,
        "eventType": "TRAFFIC_ANOMALY",
        "severity": "medium",
        "details": {"source": "python-monitor", "note": "dns-query-observed"},
    }
    response = requests.post(API_URL, headers={"x-monitor-key": MONITOR_KEY}, json=payload, timeout=5)
    print(response.status_code, response.text)


def process_packet(packet):
    if packet.haslayer(DNSQR):
        domain = packet[DNSQR].qname.decode(errors="ignore").rstrip(".")
        ip_address = packet[IP].src if packet.haslayer(IP) else "0.0.0.0"
        mac_address = getattr(packet, "src", "UNKNOWN-MAC")
        try:
            send_alert(ip_address, mac_address, domain)
        except Exception as exc:
            print(f"Error sending alert: {exc}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Network monitor for exam malpractice alerts")
    parser.add_argument("--iface", default=None, help="Network interface to sniff")
    args = parser.parse_args()
    print("Starting DNS packet monitoring...")
    sniff(filter="udp port 53", prn=process_packet, store=False, iface=args.iface)
