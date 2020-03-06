---
home: true
title: NixOS 手册
heroImage: /logo.png
heroText: NixOS 手册
tagline: Version 19.09
sidebarDepth: 2
sidebar: auto
---

# 前言

本手册描述了如何安装、使用以及拓展 NixOS —— 一个基于纯粹函数式包管理系统 Nix 的 Linux 发行版。

倘若遇到问题，请在 [Discourse](https://discourse.nixos.org/) 或 irc://irc.freenode.net/#nixos 上反馈；倘若遇到漏洞，请在 [NixOS' GitHub issue tracker](https://github.com/NixOS/nixpkgs/issues) 上反馈。

:::tip

带有`#`前缀的命令需要以 root 身份运行 —— 这意味着你需要以具有 root 权限的用户登陆或将此前缀替换为`sudo`。

:::

# 第一部分 安装

这一部分描述了第一次使用 NixOS 时应该如何获取、安装并对其进行配置。

## 第一章 获取 NixOS

NixOS 的镜像文件可以于 [NixOS 下载页面](http://nixos.org/nixos/download.html)下载。这里提供了许多安装选项。有光驱和闲置 CD 光盘的话，将镜像文件烧录至光盘上，并通过它启动计算机或许是最容易的方法。大多数人可能会使用 U 盘来引导启动。在第 2.5.1. 节「通过 USB 设备引导启动」描述了如何准备这样的一个 USB 启动盘。在 [NixOS Wiki](https://nixos.wiki/wiki/NixOS_Installation_Guide#Making_the_installation_media) 上还有更多选项。

除了尝试亲自安装 NixOS 外，下面的几种方式也可以获得一个运行的 NixOS 系统：

- 使用开放式虚拟化软件交付格式（OVF），以便在 VirtualBox 上使用。在 [NixOS 下载页面](http://nixos.org/nixos/download.html)可用。
- 使用适用于亚马逊弹性计算云服务（EC 2）的亚马逊机器镜像（AMI）。在[最新亚马逊机器镜像名单](https://github.com/NixOS/nixpkgs/blob/master/nixos/modules/virtualisation/ec2-amis.nix)可以查看在你的地区的可用项与实例型号。
- 使用基于 NixOS 的云开发工具 —— NixOps。它提供了关于 VirtualBox 和 EC 2 实例的详细规格说明。从 [NixOps 主页](https://nixos.org/nixops)获取详细信息。

## 第二章 安装 NixOS

### 2.1. 引导启动系统

NixOS 可通过 BIOS 或 UEFI 系统安装。通过 UEFI 与 BIOS 的安装步骤大致是相同的。下面将提及不同的部分。

可以通过烧录 CD / USB 设备来制作安装介质。（ 第 2.5.1. 节「通过 USB 设备引导启动」 描述了如何「烧录」USB 启动盘。）

安装介质容纳了最基础的 NixOS 安装器。它在引导启动结束时应当检测到你的大部分硬件。

在 8 号虚拟控制台为你准备了本手册。按下 `Alt`+`F8`或运行`nixos-help`以查看。

你将作为`nixos`用户自动登陆。此帐户不设口令。因此，`sudo`也不需要密码。

如果你下载了图形化镜像文件，`systemctl start display-manager`是启动桌面环境的指令。倘若要继续使用终端，`loadkeys`指令可帮助你切换到你钟爱的键盘布局。（neo 2 也有提供！）

#### 2.1.1. 给安装器联网

太多原料（像是 tarballl 文件和 Nixpkgs 二进制发布频道信息）需要下载，因此引导安装过程需要联网（运行`ip a`以检测）。所在的网络最好有一个 DHCP 服务器。没有的话，`ifconfig`可以用于手动配置网络连接。

通过图形界面手动配置网络需要先通过运行`systemctl stop NetworkManager`禁用网络管理器。

通过最小安装器手动配置 Wi-Fi 网络需要运行`wpa_supplicant -B -i interface -c <(wpa_passphrase 'SSID' 'key')`。

倘若需要从另外一台设备上通过 SSH 继续安装程序，运行`systemctl start sshd`以激活 SSH 进程。以「root」 或「nixos」登陆需要设置密码。

### 2.2. 分区与格式化

NixOS 安装器不分区或格式化磁盘，因此，你需要自己完成此工作。

NixOS 安装器搭载了多种分区工具，下面的演示例子使用 parted，fdisk、gdisk、cfdisk 与 cgdisk 也供自由选用。

推荐的分区方案因计算机的启动方式而异（Legacy Boot 或 UEFI）。

#### 2.2.1 UEFI（GPT 分区表）

对于 UEFI，下面给出一个分区样式。`/dev/sda`代指被安装的设备：

:::tip

可以安全地忽略 parted 发出的关于需要更新`/etc/fstab`的消息。

:::

1. 创建一份 GPT 分区表：

   ```
   # parted /dev/sda -- mklabel gpt
   ```

2. 添加根（root）分区，它占据除了磁盘的末端外的空间（也就是交换（swap）分区所在地）。磁盘的前端需要留有 512 Mib 大的空间供给引导分区：

   ```
   # parted /dev/sda -- mkpart primary 512MiB -8GiB
   ```

3. 添加交换分区。按需分配，现在先创建一个 8 GiB 大的：

   ```
   # parted /dev/sda -- mkpart primary linux-swap -8GiB 100%
   ```

   :::tip

   交换分区大小的规则因 Linux 发行版而异。

   :::

4. 轮到引导分区。NixOS 默认 ESP（EFI 系统分区）作为`/boot`分区。先初始化磁盘前端大小为 512 MiB 的部分：

   ```
   # parted /dev/sda -- mkpart ESP fat32 1MiB 512MiB
   # parted /dev/sda -- set 3 boot on
   ```

完成后要做的事，参考[第 2.2.3. 节「格式化」](http://cmath.cc/nix-zh/#_2-2-3-%E6%A0%BC%E5%BC%8F%E5%8C%96)。

#### 2.2.2. Legacy Boot（MBR 分区表）

对于 Legacy Boot，下面给出一个分区样式。`/dev/sda`代指被安装的设备：

:::tip

可以安全地忽略 parted 发出的关于需要更新`/etc/fstab`的消息。

:::

1. 创建一份 MBR 分区表：

   ```
   # parted /dev/sda -- mklabel msdos
   ```

2. 添加根（root）分区，它占据除了磁盘的末端外的空间（也就是交换（swap）分区所在地）。

   ```
   # parted /dev/sda -- mkpart primary 1MiB -8GiB
   ```

3. 添加交换分区。按需分配，现在先创建一个 8 GiB 大的：

   ```
   # parted /dev/sda -- mkpart primary linux-swap -8GiB 100%
   ```

   :::tip

   交换分区大小的规则因 Linux 发行版而异。

   :::

   完成后要做的事，参考[第 2.2.3. 节「格式化」](http://cmath.cc/nix-zh/#_2-2-3-%E6%A0%BC%E5%BC%8F%E5%8C%96)。

#### 2.2.3. 格式化

可以跟随下面的指令：

- 初始化为 Ext 4 分区。建议给文件系统一个有意义的标签（例子中是 nixos），它让文件系统配置独立于设备设置。像这样：

  ```
  # mkfs.ext4 -L nixos /dev/sda1
  ```

- 创建交换分区：

  ```
  # mkswap -L swap /dev/sda2
  ```

- 设置 UEFI 系统

  创建引导分区：

  ```
  # mkfs.fat -F 32 -n boot /dev/sda3
  ```

- 使用相关指令创建逻辑卷：

  参考：[LVM](https://wiki.archlinux.org/index.php/LVM#Getting_started)

- 使用 mdadm 可以创建磁盘阵列（RAID）。

### 2.3. 安装

1. 挂载将要安装 NixOS 的文件系统（例子是 /mnt）：

   ```
   # mount /dev/disk/by-label/nixos /mnt
   ```

2. UEFI 设置

   挂载引导文件系统（例子是 /mnt/boot)：

   ```
   # mkdir -p /mnt/boot
   #mount /dev/disk/by-label/boot /mnt/boot
   ```

3. 内存不足的设备可以通过激活交换分区来缓解。安装和构建过程需要与你的配置信息有关的一定量的内存。

   ```
   # swapon /dev/sda2
   ```

4. 具体化的预配置可以通过创建`/mnt/etc/nixos/congiguration.nix`。NixOS 拥有一个声明式的配置模型：你创作或修改一份关于你所期待的系统配置的文件，将它交给 NixOS 去做并且等待梦想成真。NixOS 配置文件的语法参见第五章「配置语法」。附录 A「配置选项」提供了一系列关于配置文件内容的可选项。在样例 2.4.「NixOS 配置」中给出一个最朴素的例子。

   命令`nixos-generate-config`生成一份初始化配置文件：

   ```
   # nixos-generate-config -- root /mnt
   ```

   编辑它使其满足你的需求：

   ```
   # nano /mnt/etc/nixos/configuration.nix
   ```

   倘若使用图形化系统镜像，可能还会有其它可用的编辑器（例如 vim）。

有网络连接的话，也可以安装其它编辑器，一个实例是通过运行`nix-env -f '<nixpkgs>' -iA emacs`来安装 Emacs。

- BIOS 系统

  设置[`boot.loader.grub.device`](https://nixos.org/nixos/manual/options.html#opt-boot.loader.grub.device) 是**必需**的，它决定了 GRUB 引导的加载器被安装在磁盘上的位置。NixOS 无法在没有设置它的情况下启动。

- UEFI 系统

  **必须**设置 [`boot.loader.systemd-boot.enable`](https://nixos.org/nixos/manual/options.html#opt-boot.loader.systemd-boot.enable)为 true。倘若使用 UEFI 模式启动，nixos-generate-config 在生成新配置时会自动设置它。

  参考 [boot.loader.efi](https://nixos.org/nixos/manual/options.html#opt-boot.loader.efi.canTouchEfiVariables) 与 [boot.loader.systemd](https://nixos.org/nixos/manual/options.html#opt-boot.loader.systemd-boot.enable)。

多系统并存时，将 [boot.loader.grub.useOSProber](https://nixos.org/nixos/manual/options.html#opt-boot.loader.grub.useOSProber) 选项设置为真来自动添加已安装的操作系统到 grub 菜单。

在设置文件中为设备配置网络连接的方法参见第十一章「网络连接」。

fileSystems 也是一个关键选项，它说明了 NixOS 应当挂载的文件系统。一般来说不需要手动配置，因为 nixos-generate-config 自动在 /mnt/etc/nixos/hardware-configuration.nix  处通过你现在挂载的文件系统设置好了。下次调用 nixos-generate-config 时写入的新设置将会覆盖现有的 hardware-configuration.nix，该文件被 configuration.nix 所援引。因此一般来说不应该修改它。）顺带提一下，安装完成后也可以看看《[对于已知硬件的设置](https://github.com/NixOS/nixos-hardware)》。（现在看也可以。）

:::tip

取决于不同的硬件设置与文件系统类型，可能需要在 boot.initrd.kernelModules 中设置对于挂载根文件系统必要的内核模块。否则安装的系统可能无法启动。（如果这样的情况发生了，再次使用安装介质启动设备，挂载目标文件系统于 /mnt，`fix /mnt/etc/nixos/configuration.nix`然后再次`nixos-install`。）大部分情况下，nixos-generate-config 会指出需要的模块。

:::

5. 进行安装程序

   ```
   # nixos-install
   ```

   这将会基于提供的配置文件开始安装。倘若出现了由于配置文件或一些其它原因（例如在从 NixOS 二进制缓存中下载二进制文件时的网络连接超时），你可以尝试修复你的配置文件（configuration.nix)并重新运行安装指令。

   安装的最后一步，nixos-install 将会要求你设置 root 用户的密码，像这样：

   ```
   setting root password...
   Enter new UNIX password: ***
   Retype new UNIX password: ***
   ```

   :::tip

   如果安装时无人值守，可以通过`nixos-install --no-root-passwd`来禁用需要密码的场景。

   :::

6. 倘若万事如意：

   ```
   # reboot
   ```

7. 现在应该可以启动刚刚安装的 NixOS 了。GRUB 引导菜单将会展示一列可用项（默认一个）。每每你修改配置文件（参考[《修改配置文件》](https://nixos.org/nixos/manual/index.html#sec-changing-config)），此菜单就会多出一个项。如果有错误发生，可以容易地通过它回滚。

   接下来登陆并使用 passwd 更换 root 用户的密码。

   使用 useradd 可以创建一些新的用户帐户：

   ```
   $ useradd -c 'Eelco Dolstra' -m eelco
   $ passwd eelco
   ```

   再来安装一些软件。一个实例是：

   ```
   $ nix-env -qaP \*
   ```

   这样展示了哪些包是可用的，如果安装 w3m 浏览器：

   ```
   $ nix-env -f '<nixpkgs>' -iA w3m
   ```

### 2.4. 安装小记

